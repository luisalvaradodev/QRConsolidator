import { InventoryItem, ConsolidatedInventoryItem } from '../types/inventory';

export const consolidateData = (items: InventoryItem[]): ConsolidatedInventoryItem[] => {
  const map: { [key: string]: any } = {};

  items.forEach(item => {
    if (!map[item.codigo]) {
      map[item.codigo] = {
        nombres: new Set<string>(),
        departamentos: new Set<string>(),
        marcas: new Set<string>(),
        farmacias: new Set<string>(),
        existenciaActual: 0,
        cantidad: 0, // Ventas totales en 60 días
      };
    }
    const product = map[item.codigo];
    product.nombres.add(item.nombre);
    product.departamentos.add(item.departamento);
    product.marcas.add(item.marca);
    product.farmacias.add(item.farmacia);
    product.existenciaActual += item.existenciaActual;
    product.cantidad += item.cantidad;
  });

  return Object.entries(map).map(([codigo, product]) => {
    const { existenciaActual, cantidad } = product;
    
    // Recalcular métricas a nivel consolidado
    const promedioDiario = cantidad / 60;
    const diasDeVenta = promedioDiario > 0 ? existenciaActual / promedioDiario : Infinity;

    let clasificacion = 'OK';
    let excesoUnidades = 0;

    if (cantidad > 0) {
        if (diasDeVenta < 20) clasificacion = 'Falla';
        else if (diasDeVenta > 60) {
            clasificacion = 'Exceso';
            excesoUnidades = Math.ceil(existenciaActual - (promedioDiario * 60));
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
      cantidad,
      promedioDiario,
      sugerido40d: calculateSugerido(40),
      sugerido45d: calculateSugerido(45),
      sugerido50d: calculateSugerido(50),
      sugerido60d: calculateSugerido(60),
      excesoUnidades: Math.max(0, Math.ceil(excesoUnidades)),
    };
  });
};
