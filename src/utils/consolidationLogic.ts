import { RawInventoryItem, ConsolidatedInventoryItem } from '../types/inventory';

export const consolidateData = (items: RawInventoryItem[]): ConsolidatedInventoryItem[] => {
  const productMap: { [key: string]: any } = {};

  const stockFiles = items.filter(item => item.sourceFile.toLowerCase().includes('listado'));
  const salesFiles = items.filter(item => item.sourceFile.toLowerCase().includes('vendidos'));

  stockFiles.forEach(item => {
    if (!item.codigo) return;
    productMap[item.codigo] = {
      nombre: item.nombre || productMap[item.codigo]?.nombre,
      existenciaActual: (productMap[item.codigo]?.existenciaActual || 0) + item.existenciaActual,
      departamento: item.departamento || productMap[item.codigo]?.departamento,
      marca: item.marca || productMap[item.codigo]?.marca,
      farmacias: new Set([...(productMap[item.codigo]?.farmacias || []), item.sourceFile]),
      venta60d: 0,
    };
  });

  salesFiles.forEach(item => {
    if (item.codigo && productMap[item.codigo]) {
      productMap[item.codigo].venta60d += item.cantidad;
    }
  });

  const consolidatedList: ConsolidatedInventoryItem[] = Object.entries(productMap).map(([codigo, product]) => {
    const { existenciaActual, venta60d } = product;

    const venta30d = venta60d / 2;
    const ventaDiaria = venta30d / 30;
    const diasDeInventario = ventaDiaria > 0 ? existenciaActual / ventaDiaria : Infinity;

    let clasificacion = 'OK';
    if (venta60d <= 0 && existenciaActual > 0) {
      clasificacion = 'No vendido';
    } else if (diasDeInventario > 60) {
      clasificacion = 'Exceso';
    } else if (diasDeInventario < 20) {
      clasificacion = 'Falla';
    }

    const sugerido = (days: number) => Math.ceil(Math.max(0, (ventaDiaria * days) - existenciaActual));
    const excesoUnidades = ventaDiaria > 0 ? Math.max(0, existenciaActual - (ventaDiaria * 60)) : existenciaActual;

    return {
      codigo,
      nombre: product.nombre,
      existenciaActual,
      venta60d,
      venta30d,
      ventaDiaria,
      diasDeInventario,
      clasificacion,
      sugerido40d: sugerido(40),
      sugerido45d: sugerido(45),
      sugerido50d: sugerido(50),
      sugerido60d: sugerido(60),
      excesoUnidades: Math.ceil(excesoUnidades),
      departamento: product.departamento,
      marca: product.marca,
      farmacias: Array.from(product.farmacias as Set<string>),
    };
  });

  return consolidatedList;
};