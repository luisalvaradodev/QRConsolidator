// src/utils/consolidationLogic.ts

import { RawInventoryItem, ConsolidatedInventoryItem } from '../types/inventory';

export const consolidateData = (items: RawInventoryItem[]): ConsolidatedInventoryItem[] => {
  const productMap: { [key: string]: any } = {};

  // Paso 1: Identificar los archivos de "Listado de Productos" y "Productos Mas Vendidos"
  const stockFiles = items.filter(item => item.sourceFile.toLowerCase().includes('listado'));
  const salesFiles = items.filter(item => item.sourceFile.toLowerCase().includes('vendidos'));

  // Paso 2: Procesar el stock. Esta es nuestra lista maestra de productos.
  stockFiles.forEach(item => {
    if (!item.codigo) return;
    productMap[item.codigo] = {
      nombre: item.nombre,
      existenciaActual: (productMap[item.codigo]?.existenciaActual || 0) + item.existenciaActual,
      departamento: item.departamento,
      marca: item.marca,
      farmacias: new Set([...(productMap[item.codigo]?.farmacias || []), item.sourceFile]),
      venta60d: 0, // Inicializar ventas
    };
  });

  // Paso 3: Procesar las ventas y sumarlas a los productos existentes.
  salesFiles.forEach(item => {
    if (item.codigo && productMap[item.codigo]) {
      productMap[item.codigo].venta60d += item.cantidad;
    }
  });

  // Paso 4: Calcular todo lo demás (clasificación, sugeridos, etc.)
  const consolidatedList: ConsolidatedInventoryItem[] = Object.entries(productMap).map(([codigo, product]) => {
    const { existenciaActual, venta60d } = product;
    
    // Cálculos clave
    const ventaDiaria = venta60d / 60;
    const diasDeInventario = ventaDiaria > 0 ? existenciaActual / ventaDiaria : Infinity;

    // Lógica de Clasificación del Prompt
    let clasificacion = 'OK';
    if (venta60d <= 0 && existenciaActual > 0) {
      clasificacion = 'No vendido';
    } else if (diasDeInventario > 60) {
      clasificacion = 'Exceso';
    } else if (diasDeInventario < 20) {
      clasificacion = 'Falla';
    }

    // Lógica de Sugeridos del Prompt
    const sugerido = (days: number) => Math.ceil(Math.max(0, (ventaDiaria * days) - existenciaActual));
    
    // Lógica de Exceso de Unidades del Prompt
    const excesoUnidades = ventaDiaria > 0 ? Math.max(0, existenciaActual - (ventaDiaria * 60)) : existenciaActual;

    return {
      codigo,
      nombre: product.nombre,
      existenciaActual,
      venta60d,
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
      farmacias: Array.from(product.farmacias),
    };
  });

  return consolidatedList;
};