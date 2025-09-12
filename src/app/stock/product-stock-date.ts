import { ProductStock } from './product-stock';

export interface ProductStockDate {
    id: {
        stockId: number;
        productLocalId: number;
    };
    date: string; // fecha del pedido
    productStock: ProductStock; // aquí incluimos la fecha de cada producto y demás datos
}