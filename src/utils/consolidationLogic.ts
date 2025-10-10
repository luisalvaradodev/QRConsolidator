import { InventoryItem, ConsolidatedInventoryItem } from '../types/inventory';

export const consolidateData = (items: InventoryItem[]): ConsolidatedInventoryItem[] => {
  const map: { [key: string]: any } = {};

  items.forEach(item => {
    if (!map[item.codigo]) {
      map[item.codigo] = {
        nombres: new Set(), departamentos: new Set(), marcas: new Set(), farmacias: new Set(),
        existenciaActual: 0, cantidad: 0, promedioDiario: 0,
        sugerido40d: 0, sugerido45d: 0, sugerido50d: 0, sugerido60d: 0,
        excesoUnidades: 0,
      };
    }
    const product = map[item.codigo];
    product.nombres.add(item.nombre);
    product.departamentos.add(item.departamento);
    product.marcas.add(item.marca);
    product.farmacias.add(item.farmacia);
    product.existenciaActual += item.existenciaActual;
    product.cantidad += item.cantidad;
    product.promedioDiario += item.promedioDiario;
    product.sugerido40d += item.sugerido40d;
    product.sugerido45d += item.sugerido45d;
    product.sugerido50d += item.sugerido50d;
    product.sugerido60d += item.sugerido60d;
    product.excesoUnidades += item.excesoUnidades;
  });

  return Object.entries(map).map(([codigo, product]) => {
    const { existenciaActual, cantidad, promedioDiario } = product;
    let clasificacion = 'OK';
    if (existenciaActual <= 0 && cantidad > 0) clasificacion = 'Falla';
    else if (promedioDiario > 0 && (existenciaActual / promedioDiario) > 90) clasificacion = 'Exceso';
    else if (promedioDiario === 0 && existenciaActual > 0) clasificacion = 'No vendido';
    
    return {
      codigo, clasificacion,
      nombres: Array.from(product.nombres),
      departamentos: Array.from(product.departamentos),
      marcas: Array.from(product.marcas),
      farmacias: Array.from(product.farmacias),
      existenciaActual: product.existenciaActual,
      cantidad: product.cantidad,
      promedioDiario: product.promedioDiario,
      sugerido40d: product.sugerido40d,
      sugerido45d: product.sugerido45d,
      sugerido50d: product.sugerido50d,
      sugerido60d: product.sugerido60d,
      excesoUnidades: product.excesoUnidades,
    };
  });
};