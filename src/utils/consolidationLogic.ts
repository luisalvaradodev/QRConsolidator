import { InventoryItem, ConsolidatedInventoryItem, ClassificationSettings } from '../types/inventory';

export const consolidateData = (items: InventoryItem[], settings: ClassificationSettings): ConsolidatedInventoryItem[] => {
  const map: { [key: string]: any } = {};

  items.forEach(item => {
    if (!map[item.codigo]) {
      map[item.codigo] = {
        nombres: new Set<string>(),
        departamentos: new Set<string>(),
        marcas: new Set<string>(),
        farmacias: new Set<string>(),
        existenciaActual: 0,
        existenciasPorFarmacia: {} as { [farmacia: string]: number },
        cantidad: 0, // Ventas totales en 60 días
      };
    }
    const product = map[item.codigo];
    product.nombres.add(item.nombre);
    product.departamentos.add(item.departamento);
    product.marcas.add(item.marca);
    product.farmacias.add(item.farmacia);
    product.existenciaActual += item.existenciaActual;
    product.existenciasPorFarmacia[item.farmacia] = item.existenciaActual;
    product.cantidad += item.cantidad;
  });

  return Object.entries(map).map(([codigo, product]) => {
    const { existenciaActual, cantidad, existenciasPorFarmacia } = product; // cantidad es el total de ventas de 60d

    // --- INICIO DE CAMBIOS ---
    // CORRECCIÓN: Calcular el promedio diario primero.
    const promedioDiario = cantidad / 60;

    // CORRECCIÓN: Calcular las ventas totales para cada período.
    const ventas30d = promedioDiario * 30;
    const ventas40d = promedioDiario * 40;
    const ventas50d = promedioDiario * 50;
    
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

    return {
      codigo,
      clasificacion,
      nombres: Array.from(product.nombres as Set<string>),
      departamentos: Array.from(product.departamentos as Set<string>),
      marcas: Array.from(product.marcas as Set<string>),
      farmacias: Array.from(product.farmacias as Set<string>),
      existenciaActual: Math.ceil(existenciaActual),
      existenciasPorFarmacia,
      cantidad, // Mantenemos la cantidad total de ventas en 60d
      // --- INICIO DE CAMBIOS ---
      // CORRECCIÓN: Asignamos los valores correctos
      promedio30d: ventas30d,
      promedio40d: ventas40d,
      promedio50d: ventas50d,
      promedio60d: cantidad, // El "promedio" de 60 días son las ventas totales de 60 días
      // --- FIN DE CAMBIOS ---
      sugerido30d: calculateSugerido(30),
      sugerido40d: calculateSugerido(40),
      sugerido50d: calculateSugerido(50),
      sugerido60d: calculateSugerido(60),
      excesoUnidades: Math.max(0, Math.ceil(excesoUnidades)),
    };
  });
};