// src/utils/consolidationLogic.ts

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
        monedaFactorCambio: 0,
        costoUnitario: 0,
        utilidad: 0,
        precioMaximo: 0,
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
    product.monedaFactorCambio = item.monedaFactorCambio; // Asumiendo que estos valores son los mismos para el mismo producto
    product.costoUnitario = item.costoUnitario;
    product.utilidad = item.utilidad;
    product.precioMaximo = item.precioMaximo;
  });

  return Object.entries(map).map(([codigo, product]) => {
    const { existenciaActual, cantidad, existenciasPorFarmacia } = product; // cantidad es el total de ventas de 60d

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

    const promedios: { [key: string]: number } = {};
    const sugeridos: { [key: string]: number } = {};

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
      excesoUnidades: Math.max(0, Math.ceil(excesoUnidades)),
      monedaFactorCambio: product.monedaFactorCambio,
      costoUnitario: product.costoUnitario,
      utilidad: product.utilidad,
      precioMaximo: product.precioMaximo,
      ...promedios,
      ...sugeridos
    };
  });
};