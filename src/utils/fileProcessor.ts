import * as XLSX from 'xlsx';
import { InventoryItem, ClassificationSettings } from '../types/inventory';

// Helper para normalizar los encabezados de las columnas para un acceso consistente
const normalizeHeader = (h: string): string => h ? h.toLowerCase().trim().replace(/á/g,'a').replace(/é/g,'e').replace(/í/g,'i').replace(/ó/g,'o').replace(/ú/g,'u').replace(/\./g, '').replace(/\s+/g, '') : '';

// Helper para normalizar las claves de un objeto de datos
const normalizeObjectKeys = (obj: any): any => {
    const newObj: any = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const normalizedKey = normalizeHeader(key);
            if (normalizedKey === 'código' || normalizedKey === 'codigo') newObj.codigo = obj[key];
            else if (normalizedKey === 'nombre') newObj.nombre = obj[key];
            else if (normalizedKey === 'existenciaactual' || normalizedKey === 'existencia') newObj.existenciaActual = obj[key];
            else if (normalizedKey === 'departamento' || normalizedKey === 'dptodescrip') newObj.departamento = obj[key];
            else if (normalizedKey === 'marca') newObj.marca = obj[key];
            else if (normalizedKey === 'ventas60d' || normalizedKey === 'cantidad') newObj.ventas60d = obj[key];
            else newObj[normalizedKey] = obj[key];
        }
    }
    return newObj;
};

// Lógica de cálculo principal para los datos de una farmacia
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
        const sales60d = Number(item.ventas60d) || 0;
        if (item.codigo) {
            const codigoStr = String(item.codigo);
            salesMap.set(codigoStr, (salesMap.get(codigoStr) || 0) + sales60d);
        }
    });
    
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
            keywords.forEach(kw => {
                if(lowerProductName.includes(kw)) score++;
            });
            if (score > maxScore) {
                maxScore = score;
                bestMatch = dept;
            }
        });
        return bestMatch;
    }

    return products
        // Se ha ELIMINADO la línea de filtro que buscaba 'COD01' en el nombre del producto.
        .filter(p => p.nombre)
        .map(p => {
            const codigo = String(p.codigo || '');
            const existenciaActual = Number(p.existenciaActual) || 0;
            const cantidad = salesMap.get(codigo) || 0; // Ventas totales en 60 días
            
            // --- INICIO DE CAMBIOS ---
            // CORRECCIÓN: Calcular el promedio diario primero.
            const promedioDiario = cantidad / 60;

            // CORRECCIÓN: Calcular las ventas totales para cada período.
            const ventas30d = promedioDiario * 30;
            const ventas40d = promedioDiario * 40;
            const ventas50d = promedioDiario * 50;
            // El promedio de 60d es simplemente el total de ventas en 60 días.

            const diasDeVenta = promedioDiario > 0 ? existenciaActual / promedioDiario : Infinity;
            // --- FIN DE CAMBIOS ---

            let clasificacion = 'OK';
            let excesoUnidades = 0;

            if (cantidad > 0) {
                if (diasDeVenta < settings.diasFalla) clasificacion = 'Falla';
                else if (diasDeVenta > settings.diasExceso) {
                    clasificacion = 'Exceso';
                    excesoUnidades = Math.ceil(existenciaActual - (promedioDiario * settings.diasExceso));
                }
            } else {
                if (existenciaActual > 0) clasificacion = 'No vendido';
            }

            if (clasificacion === 'No vendido') {
                excesoUnidades = existenciaActual;
            }
            
            const calculateSugerido = (days: number): number => {
                const required = promedioDiario * days;
                const suggestion = required - existenciaActual;
                if (clasificacion === 'Falla' || (clasificacion === 'OK' && suggestion > 0)) {
                    return Math.max(0, Math.ceil(suggestion));
                }
                return 0;
            };
            
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
                cantidad, // Se mantiene como el total de ventas en 60 días
                // --- INICIO DE CAMBIOS ---
                // CORRECCIÓN: Asignamos los valores correctos de ventas por período.
                // El "promedio" que pediste es en realidad el total de ventas en ese período.
                promedio30d: ventas30d,
                promedio40d: ventas40d,
                promedio50d: ventas50d,
                promedio60d: cantidad, // El "promedio" de 60 días son las ventas totales de 60 días
                // --- FIN DE CAMBIOS ---
                clasificacion,
                sugerido30d: calculateSugerido(30),
                sugerido40d: calculateSugerido(40),
                sugerido50d: calculateSugerido(50),
                sugerido60d: calculateSugerido(60),
                excesoUnidades: Math.max(0, Math.ceil(excesoUnidades)),
                farmacia: farmaciaName,
            };
        });
};

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

// Función principal exportada para ser llamada desde la UI
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