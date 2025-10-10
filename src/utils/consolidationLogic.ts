import { InventoryItem, ConsolidatedInventoryItem } from '../types/inventory';

export const consolidateAndSuggest = (items: InventoryItem[]): ConsolidatedInventoryItem[] => {
  const consolidatedMap: { [key: string]: any } = {};

  items.forEach(item => {
    if (!item.codigo) return; // Ignorar filas sin código

    if (!consolidatedMap[item.codigo]) {
      consolidatedMap[item.codigo] = {
        nombres: new Set<string>(),
        departamentos: new Set<string>(),
        marcas: new Set<string>(),
        farmacias: new Set<string>(),
        existenciaActual: 0,
        cantidad: 0,
        promedioDiario: 0,
      };
    }
    
    const product = consolidatedMap[item.codigo];
    product.nombres.add(item.nombre);
    product.departamentos.add(item.departamento);
    product.marcas.add(item.marca);
    product.farmacias.add(item.farmacia);
    product.existenciaActual += item.existenciaActual;
    product.cantidad += item.cantidad;
    product.promedioDiario += item.promedioDiario;
  });

  return Object.entries(consolidatedMap).map(([codigo, product]) => {
    const { existenciaActual, promedioDiario } = product;
    
    let clasificacion = 'OK';
    if (existenciaActual <= 0 && promedioDiario > 0) {
      clasificacion = 'Falla';
    } else if (promedioDiario > 0 && (existenciaActual / promedioDiario) > 90) {
      clasificacion = 'Exceso';
    } else if (promedioDiario === 0 && existenciaActual > 0) {
      clasificacion = 'No vendido';
    }
    
    return {
      codigo,
      nombres: Array.from(product.nombres),
      departamentos: Array.from(product.departamentos),
      marcas: Array.from(product.marcas),
      farmacias: Array.from(product.farmacias),
      existenciaActual: product.existenciaActual,
      cantidad: product.cantidad,
      promedioDiario: product.promedioDiario,
      clasificacion,
      sugerido40d: product.promedioDiario * 40,
      sugerido45d: product.promedioDiario * 45,
      sugerido50d: product.promedioDiario * 50,
      sugerido60d: product.promedioDiario * 60,
    };
  });
};