import { InventoryItem, ConsolidatedInventoryItem } from '../types/inventory';

export const consolidateAndSuggest = (items: InventoryItem[]): ConsolidatedInventoryItem[] => {
  const consolidatedMap: { [key: string]: any } = {};

  // Paso 1: Agrupar por 'codigo' y sumar los datos
  items.forEach(item => {
    // Si el producto no está en nuestro mapa, lo inicializamos
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
    
    // Agregamos y sumamos los datos del item actual
    const product = consolidatedMap[item.codigo];
    if (item.nombre) product.nombres.add(item.nombre);
    if (item.departamento) product.departamentos.add(item.departamento);
    if (item.marca) product.marcas.add(item.marca);
    if (item.farmacia) product.farmacias.add(item.farmacia);
    
    product.existenciaActual += item.existenciaActual;
    product.cantidad += item.cantidad;
    product.promedioDiario += item.promedioDiario;
  });

  // Paso 2: Calcular sugerencias, clasificación y dar formato final
  const result: ConsolidatedInventoryItem[] = Object.values(consolidatedMap).map((product) => {
    const { existenciaActual, promedioDiario, cantidad } = product;
    
    // Lógica de Sugerencia: (Ventas Diarias * Días) - Stock Actual
    // Nos aseguramos de que el resultado nunca sea negativo con Math.max(0, ...)
    const sugerido40d = Math.max(0, Math.round(promedioDiario * 40) - existenciaActual);
    const sugerido45d = Math.max(0, Math.round(promedioDiario * 45) - existenciaActual);
    const sugerido50d = Math.max(0, Math.round(promedioDiario * 50) - existenciaActual);
    const sugerido60d = Math.max(0, Math.round(promedioDiario * 60) - existenciaActual);

    // Lógica de Clasificación Consolidada
    let clasificacion = 'OK';
    if (existenciaActual <= 0 && promedioDiario > 0) {
      clasificacion = 'Falla'; // No hay stock real pero sí se vende
    } else if (promedioDiario > 0 && (existenciaActual / promedioDiario) > 90) { 
      clasificacion = 'Exceso'; // Hay stock para más de 90 días
    } else if (promedioDiario === 0 && existenciaActual > 0) {
      clasificacion = 'No vendido'; // Hay stock pero no se vende
    }
    
    return {
      codigo: product.codigo,
      nombres: Array.from(product.nombres),
      departamentos: Array.from(product.departamentos),
      marcas: Array.from(product.marcas),
      farmacias: Array.from(product.farmacias),
      existenciaActual,
      cantidad,
      promedioDiario,
      clasificacion,
      sugerido40d,
      sugerido45d,
      sugerido50d,
      sugerido60d,
    };
  });

  return result;
};