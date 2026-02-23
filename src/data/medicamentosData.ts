
export interface MedicamentoInfo {
    medicamento: string;
    atc: string;
    presentacionComercial: number;
    dosisEstandar: string;
    diasAdministracion: number;
    diasDescanso: number;
    total: number;
    frecuenciaEntrega: number;
    precioCompra?: number;
    precioVenta?: number;
}

export const MEDICAMENTOS_LIST: MedicamentoInfo[] = [
    { medicamento: "ABEMACILIB X 150 MILIGRAMOS", atc: "L01EF03", presentacionComercial: 60, dosisEstandar: "300 MG X 30 DIAS", diasAdministracion: 30, diasDescanso: 0, total: 30, frecuenciaEntrega: 27, precioCompra: 0, precioVenta: 0 },
    { medicamento: "ABEMACILIB X 100 MILIGRAMOS", atc: "L01EF03", presentacionComercial: 30, dosisEstandar: "100 MG X 30 DIAS", diasAdministracion: 30, diasDescanso: 0, total: 30, frecuenciaEntrega: 27, precioCompra: 0, precioVenta: 0 },
    { medicamento: "ABIRATERONA ACETATO X 250 MILIGRAMOS", atc: "L01EG02", presentacionComercial: 120, dosisEstandar: "1000 MG X 30 DIAS", diasAdministracion: 30, diasDescanso: 0, total: 30, frecuenciaEntrega: 27, precioCompra: 0, precioVenta: 0 },
    { medicamento: "ACIDO TRASRETINOICO (TRETINOINA) X 10 MILIGRAMOS", atc: "L01XF01", presentacionComercial: 100, dosisEstandar: "SEGÚN INDICACION", diasAdministracion: 30, diasDescanso: 0, total: 30, frecuenciaEntrega: 27, precioCompra: 0, precioVenta: 0 },
    { medicamento: "AFATINIB X 30 MILIGRAMOS", atc: "L01EB03", presentacionComercial: 30, dosisEstandar: "30 MG X 30 DIAS", diasAdministracion: 30, diasDescanso: 0, total: 30, frecuenciaEntrega: 27, precioCompra: 0, precioVenta: 0 },
    { medicamento: "AFATINIB X 40 MILIGRAMOS", atc: "L01EB03", presentacionComercial: 30, dosisEstandar: "30 MG X 30 DIAS", diasAdministracion: 30, diasDescanso: 0, total: 30, frecuenciaEntrega: 27, precioCompra: 0, precioVenta: 0 },
    { medicamento: "ALECTINIB X 150 MILIGRAMOS", atc: "L01ED03", presentacionComercial: 112, dosisEstandar: "1200 MG X 28 DIAS", diasAdministracion: 28, diasDescanso: 0, total: 28, frecuenciaEntrega: 25, precioCompra: 0, precioVenta: 0 },
    { medicamento: "ANASTROZOL X 1 MILIGRAMOS", atc: "L02BG03", presentacionComercial: 30, dosisEstandar: "1 MG X 30 DIAS", diasAdministracion: 30, diasDescanso: 0, total: 30, frecuenciaEntrega: 27, precioCompra: 0, precioVenta: 0 },
    { medicamento: "APALUTAMIDA X 60 MILIGRAMOS", atc: "L02BB05", presentacionComercial: 120, dosisEstandar: "240 MG X 30 DIAS", diasAdministracion: 30, diasDescanso: 0, total: 30, frecuenciaEntrega: 27, precioCompra: 0, precioVenta: 0 },
    { medicamento: "AXITINIB X 5 MILIGRAMOS", atc: "L01EK01", presentacionComercial: 60, dosisEstandar: "10 MG X 30 DIAS", diasAdministracion: 30, diasDescanso: 0, total: 30, frecuenciaEntrega: 27, precioCompra: 0, precioVenta: 0 },
    { medicamento: "BOSUTINIB X 100 MILIGRAMOS", atc: "L01EA04", presentacionComercial: 28, dosisEstandar: "400 MG X 28 DIAS", diasAdministracion: 28, diasDescanso: 0, total: 28, frecuenciaEntrega: 25, precioCompra: 0, precioVenta: 0 },
    { medicamento: "BOSUTINIB X 500 MILIGRAMOS", atc: "L01EA04", presentacionComercial: 30, dosisEstandar: "500 MG X 30 DIAS", diasAdministracion: 30, diasDescanso: 0, total: 30, frecuenciaEntrega: 27, precioCompra: 0, precioVenta: 0 },
    { medicamento: "CABOZANTINIB X 20 MILIGRAMOS", atc: "L01EX07", presentacionComercial: 30, dosisEstandar: "60 MG X 30 DIAS", diasAdministracion: 30, diasDescanso: 0, total: 30, frecuenciaEntrega: 27, precioCompra: 0, precioVenta: 0 },
    { medicamento: "CABOZANTINIB X 40 MILIGRAMOS", atc: "L01EX07", presentacionComercial: 30, dosisEstandar: "60 MG X 30 DIAS", diasAdministracion: 30, diasDescanso: 0, total: 30, frecuenciaEntrega: 27, precioCompra: 0, precioVenta: 0 },
    { medicamento: "CABOZANTINIB X 60 MILIGRAMOS", atc: "L01EX07", presentacionComercial: 30, dosisEstandar: "60 MG X 30 DIAS", diasAdministracion: 30, diasDescanso: 0, total: 30, frecuenciaEntrega: 27, precioCompra: 0, precioVenta: 0 },
];
