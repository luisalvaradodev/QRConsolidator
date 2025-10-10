// src/utils/consolidationLogic.ts

import { InventoryItem, ConsolidatedInventoryItem } from '../types/inventory';

export const consolidateAndSuggest = (items: InventoryItem[]): ConsolidatedInventoryItem[] => {
  const consolidatedMap: { [key: string]: any } = {};

  // Paso 1: Agrupar por código y sumar los valores de stock real y de sistema por separado.
  items.forEach(item => {
    if (!item.codigo) return; // Ignorar filas sin código

    if (!consolidatedMap[item.codigo]) {
      consolidatedMap[item.codigo] = {
        nombres: new Set<string>(),
        departamentos: new Set<string>(),
        marcas: new Set<string>(),
        farmacias: new Set<string>(),
        existenciaActual: 0, // Campo para el Stock Real
        cantidad: 0,         // Campo para el Stock del Sistema
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

  // Paso 2: Aplicar la lógica de negocio a los totales consolidados.
  return Object.entries(consolidatedMap).map(([codigo, product]) => {
    const { existenciaActual, cantidad, promedioDiario } = product;
    
    let clasificacion = 'OK'; // Clasificación por defecto

    // --- LÓGICA DE NEGOCIO CORREGIDA ---
    if (existenciaActual <= 0 && cantidad > 0) {
      // Si no hay stock FÍSICO, pero el SISTEMA dice que hay, es una FALLA.
      clasificacion = 'Falla'; 
    } else if (promedioDiario > 0 && (existenciaActual / promedioDiario) > 90) {
      // El exceso se calcula sobre el stock FÍSICO.
      clasificacion = 'Exceso'; 
    } else if (promedioDiario === 0 && existenciaActual > 0) {
      // El producto no vendido se basa en el stock FÍSICO.
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
    };
  });
};