import * as XLSX from 'xlsx';
import { InventoryItem, ClassificationSettings } from '../types/inventory';

// --- FUNCIÓN AUXILIAR MEJORADA ---
// Convierte números en formato con coma decimal a un número estándar de JS.
// Si el valor ya es un número, lo devuelve sin cambios.
const parseSpanishNumber = (value: any): number => {
    if (typeof value === 'number') {
        return value;
    }
    if (typeof value === 'string') {
        // Elimina los puntos de miles (si los hay) y reemplaza la coma decimal por un punto.
        const cleanedValue = value.replace(/\./g, '').replace(',', '.');
        const parsed = parseFloat(cleanedValue);
        return isNaN(parsed) ? 0 : parsed;
    }
    // Si no es ni número ni string, devuelve 0.
    return 0;
};

// Helper para normalizar los encabezados (sin cambios, ya es flexible)
const normalizeHeader = (h: string): string => h ? h.toLowerCase().trim().replace(/á/g,'a').replace(/é/g,'e').replace(/í/g,'i').replace(/ó/g,'o').replace(/ú/g,'u').replace(/\./g, '').replace(/\s+/g, '') : '';

// Helper para normalizar las claves de un objeto (sin cambios, ya es flexible)
const normalizeObjectKeys = (obj: any): any => {
    const newObj: any = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const normalizedKey = normalizeHeader(key);
            if (normalizedKey === 'código' || normalizedKey === 'codigo') newObj.codigo = obj[key];
            else if (normalizedKey === 'nombre') newObj.nombre = obj[key];
            else if (normalizedKey === 'existenciaactual' || normalizedKey === 'existencia') newObj.existenciaActual = obj[key];
            else if (normalizedKey === 'departamento' || normalizedKey === 'dptodescrip' || normalizedKey === 'departamentonombre') newObj.departamento = obj[key];
            else if (normalizedKey === 'marca') newObj.marca = obj[key];
            // Mapea ambas posibilidades a una sola clave: 'ventas60d'
            else if (normalizedKey === 'ventas60d' || normalizedKey === 'cantidad') newObj.ventas60d = obj[key];
            else if (normalizedKey === 'monedafactorcambio') newObj.monedaFactorCambio = obj[key];
            else if (normalizedKey === 'costounitario') newObj.costoUnitario = obj[key];
            else if (normalizedKey === '%util') newObj.utilidad = obj[key];
            else if (normalizedKey === 'preciomaximo') newObj.precioMaximo = obj[key];
            else newObj[normalizedKey] = obj[key];
        }
    }
    return newObj;
};

// --- FUNCIÓN CENTRALIZADA PARA CÁLCULOS (ACTUALIZADA) ---
const calculateDerivedMetrics = (existenciaActual: number, cantidad: number, settings: ClassificationSettings) => {
    const promedioDiario = cantidad / 60;
    const diasDeVenta = promedioDiario > 0 ? existenciaActual / promedioDiario : Infinity;

    let clasificacion = 'OK';
    let excesoUnidades = 0;

    if (existenciaActual === 0 && cantidad === 0) {
        clasificacion = 'No vendido';
    } else if (cantidad > 0) {
        if (diasDeVenta < settings.diasFalla) clasificacion = 'Falla';
        else if (diasDeVenta > settings.diasExceso) {
            clasificacion = 'Exceso';
            excesoUnidades = Math.ceil(existenciaActual - (promedioDiario * settings.diasExceso));
        }
    } else { // cantidad es 0 pero existencia es > 0
        clasificacion = 'No vendido';
    }

    if (clasificacion === 'No vendido') {
        excesoUnidades = existenciaActual;
    }

    const promedios: { [key: string]: any } = {};
    const sugeridos: { [key: string]: any } = {};

    settings.periodos.forEach(days => {
        promedios[`promedio${days}d`] = promedioDiario * days;
        const required = promedioDiario * days;
        const suggestion = required - existenciaActual;
        if (clasificacion === 'Falla' || (clasificacion === 'OK' && suggestion > 0)) {
            sugeridos[`sugerido${days}d`] = Math.max(0, Math.ceil(suggestion));
        } else {
            sugeridos[`sugerido${days}d`] = 0;
        }
    });

    // NUEVA LÓGICA: Calcular cantidad consolidada según clasificación
    let cantidadConsolidada = 0;
    switch (clasificacion) {
      case 'Falla':
        cantidadConsolidada = Math.max(0, Math.ceil((promedioDiario * settings.diasFalla) - existenciaActual));
        break;
      case 'Exceso':
        cantidadConsolidada = excesoUnidades;
        break;
      case 'No vendido':
        cantidadConsolidada = existenciaActual;
        break;
      case 'OK':
        // Para OK, si hay sugerencias positivas, tomamos la menor
        const sugerenciasPositivas = settings.periodos
          .map(days => sugeridos[`sugerido${days}d`])
          .filter(s => s > 0);
        cantidadConsolidada = sugerenciasPositivas.length > 0 ? Math.min(...sugerenciasPositivas) : 0;
        break;
      default:
        cantidadConsolidada = 0;
    }

    return {
        clasificacion,
        excesoUnidades: Math.max(0, Math.ceil(excesoUnidades)),
        cantidadConsolidada: Math.max(0, Math.ceil(cantidadConsolidada)), // NUEVA PROPIEDAD
        ...promedios,
        ...sugeridos,
    };
};

// --- FUNCIÓN DE REPROCESAMIENTO (ACTUALIZADA) ---
export const reprocessRawData = (currentRawData: InventoryItem[], settings: ClassificationSettings): InventoryItem[] => {
    return currentRawData.map(item => {
        const derived = calculateDerivedMetrics(item.existenciaActual, item.cantidad, settings);
        const newItem: InventoryItem = {
             codigo: item.codigo,
             nombre: item.nombre,
             existenciaActual: item.existenciaActual,
             departamento: item.departamento,
             marca: item.marca,
             cantidad: item.cantidad,
             farmacia: item.farmacia,
             monedaFactorCambio: item.monedaFactorCambio,
             costoUnitario: item.costoUnitario,
             utilidad: item.utilidad,
             precioMaximo: item.precioMaximo,
             ...derived
        };
        return newItem;
    });
};

// --- LÓGICA PRINCIPAL DE CÁLCULO (ACTUALIZADA) ---
const calculateInventoryMetrics = (
    rawProducts: any[],
    rawSales: any[],
    farmaciaName: string,
    settings: ClassificationSettings
): InventoryItem[] => {
    const products = rawProducts.map(normalizeObjectKeys);
    const sales = rawSales.map(normalizeObjectKeys);

    const salesMap = new Map<string, number>();
    sales.forEach(item => {
        // --- ¡AQUÍ ESTÁ LA LÓGICA DE COMPATIBILIDAD! ---
        // 1. Busca la columna 'ventas60d' (que puede venir de 'Cantidad' o 'Ventas 60d').
        // 2. Si no existe, busca la columna 'existenciaActual' como alternativa.
        // 3. Usa la función 'parseSpanishNumber' para leer el valor correctamente.
        const salesQty = parseSpanishNumber(item.ventas60d ?? item.existenciaActual);
        if (item.codigo) {
            const codigoStr = String(item.codigo);
            salesMap.set(codigoStr, (salesMap.get(codigoStr) || 0) + salesQty);
        }
    });
    
    // Lógica para inferir departamento (sin cambios)
    const departmentKeywords = new Map<string, Set<string>>();
    products.forEach(p => {
          const departamento = p.departamento || '';
          if (departamento && p.nombre && departamento.toLowerCase() !== 'sin depto.') {
              if(!departmentKeywords.has(departamento)) departmentKeywords.set(departamento, new Set());
              const words = String(p.nombre).toLowerCase().match(/\b(\w{4,})\b/g) || [];
              words.forEach(word => departmentKeywords.get(departamento)!.add(word));
          }
    });
    const inferDepartment = (productName: string): string => {
          let bestMatch = 'Sin Depto.';
          let maxScore = 0;
          const lowerProductName = String(productName).toLowerCase();
          departmentKeywords.forEach((keywords, dept) => {
              let score = 0;
              keywords.forEach(kw => { if(lowerProductName.includes(kw)) score++; });
              if (score > maxScore) { maxScore = score; bestMatch = dept; }
          });
          return bestMatch;
    };

    return products
        .filter(p => p.nombre && String(p.nombre).trim().toUpperCase() !== 'COD01')
        .map(p => {
            const codigo = String(p.codigo || '');
            // --- ROBUSTEZ MEJORADA ---
            // Se usa 'parseSpanishNumber' en todos los campos numéricos para asegurar la lectura correcta.
            const existenciaActual = parseSpanishNumber(p.existenciaActual);
            const cantidad = salesMap.get(codigo) || 0;
            
            const derivedMetrics = calculateDerivedMetrics(existenciaActual, cantidad, settings);
            
            let departamento = p.departamento || '';
            if (!departamento || departamento.toLowerCase().includes('sin depto')) {
                departamento = inferDepartment(p.nombre);
            }

            return {
                codigo,
                nombre: String(p.nombre || ''),
                existenciaActual: Math.ceil(existenciaActual),
                departamento: departamento || 'Sin Depto.',
                marca: String(p.marca || 'Sin Marca'),
                cantidad,
                farmacia: farmaciaName,
                monedaFactorCambio: parseSpanishNumber(p.monedaFactorCambio),
                costoUnitario: parseSpanishNumber(p.costoUnitario),
                utilidad: parseSpanishNumber(p.utilidad),
                precioMaximo: parseSpanishNumber(p.precioMaximo),
                ...derivedMetrics
            };
        });
};

// Función para leer el archivo (sin cambios)
const readFile = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                resolve(XLSX.utils.sheet_to_json(sheet));
            } catch (err) { reject(err); }
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsArrayBuffer(file);
    });
};

// Función principal para procesar archivos (sin cambios)
export const processFile = async (files: File[], settings: ClassificationSettings): Promise<InventoryItem[]> => {
    const getPharmacyKey = (name: string): string => {
        const lowerName = name.toLowerCase();
        if (lowerName.includes('q1')) return 'Q1';
        if (lowerName.includes('q2')) return 'Q2';
        if (lowerName.includes('fa') || lowerName.includes('farmanaco')) return 'Farmanaco';
        return 'unknown';
    };

    const fileMap = new Map<string, { productsFile?: File, salesFile?: File }>();

    for (const file of files) {
        const key = getPharmacyKey(file.name);
        if (key === 'unknown') continue;
        if (!fileMap.has(key)) fileMap.set(key, {});

        const entry = fileMap.get(key)!;
        if (file.name.toLowerCase().includes('listado')) entry.productsFile = file;
        else if (file.name.toLowerCase().includes('vendidos')) entry.salesFile = file;
    }
    
    let allProcessedData: InventoryItem[] = [];

    for (const [farmacyName, filePair] of fileMap.entries()) {
        if (!filePair.productsFile) continue;

        const productsData = await readFile(filePair.productsFile);
        const salesData = filePair.salesFile ? await readFile(filePair.salesFile) : [];

        const pharmacyResult = calculateInventoryMetrics(productsData, salesData, farmacyName, settings);
        allProcessedData = allProcessedData.concat(pharmacyResult);
    }
    
    return allProcessedData;
};