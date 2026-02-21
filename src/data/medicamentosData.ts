
export interface MedicamentoInfo {
    medicamento: string;
    presentacionComercial: number;
    dosisEstandar: string;
    diasAdministracion: number;
    diasDescanso: number;
    total: number;
    frecuenciaEntrega: number;
}

export const MEDICAMENTOS_LIST: MedicamentoInfo[] = [
    { medicamento: "ABEMACILIB X 150 MILIGRAMOS", presentacionComercial: 60, dosisEstandar: "300 MG X 30 DIAS", diasAdministracion: 30, diasDescanso: 0, total: 30, frecuenciaEntrega: 27 },
    { medicamento: "ABEMACILIB X 100 MILIGRAMOS", presentacionComercial: 30, dosisEstandar: "100 MG X 30 DIAS", diasAdministracion: 30, diasDescanso: 0, total: 30, frecuenciaEntrega: 27 },
    { medicamento: "ABIRATERONA ACETATO X 250 MILIGRAMOS", presentacionComercial: 120, dosisEstandar: "1000 MG X 30 DIAS", diasAdministracion: 30, diasDescanso: 0, total: 30, frecuenciaEntrega: 27 },
    { medicamento: "ACIDO TRASRETINOICO (TRETINOINA) X 10 MILIGRAMOS", presentacionComercial: 100, dosisEstandar: "SEGÚN INDICACION", diasAdministracion: 30, diasDescanso: 0, total: 30, frecuenciaEntrega: 27 },
    { medicamento: "AFATINIB X 30 MILIGRAMOS", presentacionComercial: 30, dosisEstandar: "30 MG X 30 DIAS", diasAdministracion: 30, diasDescanso: 0, total: 30, frecuenciaEntrega: 27 },
    { medicamento: "AFATINIB X 40 MILIGRAMOS", presentacionComercial: 30, dosisEstandar: "30 MG X 30 DIAS", diasAdministracion: 30, diasDescanso: 0, total: 30, frecuenciaEntrega: 27 },
    { medicamento: "ALECTINIB X 150 MILIGRAMOS", presentacionComercial: 112, dosisEstandar: "1200 MG X 28 DIAS", diasAdministracion: 28, diasDescanso: 0, total: 28, frecuenciaEntrega: 25 },
    { medicamento: "ANASTROZOL X 1 MILIGRAMOS", presentacionComercial: 30, dosisEstandar: "1 MG X 30 DIAS", diasAdministracion: 30, diasDescanso: 0, total: 30, frecuenciaEntrega: 27 },
    { medicamento: "APALUTAMIDA X 60 MILIGRAMOS", presentacionComercial: 120, dosisEstandar: "240 MG X 30 DIAS", diasAdministracion: 30, diasDescanso: 0, total: 30, frecuenciaEntrega: 27 },
    { medicamento: "AXITINIB X 5 MILIGRAMOS", presentacionComercial: 60, dosisEstandar: "10 MG X 30 DIAS", diasAdministracion: 30, diasDescanso: 0, total: 30, frecuenciaEntrega: 27 },
    { medicamento: "BOSUTINIB X 100 MILIGRAMOS", presentacionComercial: 28, dosisEstandar: "400 MG X 28 DIAS", diasAdministracion: 28, diasDescanso: 0, total: 28, frecuenciaEntrega: 25 },
    { medicamento: "BOSUTINIB X 500 MILIGRAMOS", presentacionComercial: 30, dosisEstandar: "500 MG X 30 DIAS", diasAdministracion: 30, diasDescanso: 0, total: 30, frecuenciaEntrega: 27 },
    { medicamento: "CABOZANTINIB X 20 MILIGRAMOS", presentacionComercial: 30, dosisEstandar: "60 MG X 30 DIAS", diasAdministracion: 30, diasDescanso: 0, total: 30, frecuenciaEntrega: 27 },
    { medicamento: "CABOZANTINIB X 40 MILIGRAMOS", presentacionComercial: 30, dosisEstandar: "60 MG X 30 DIAS", diasAdministracion: 30, diasDescanso: 0, total: 30, frecuenciaEntrega: 27 },
    { medicamento: "CABOZANTINIB X 60 MILIGRAMOS", presentacionComercial: 30, dosisEstandar: "60 MG X 30 DIAS", diasAdministracion: 30, diasDescanso: 0, total: 30, frecuenciaEntrega: 27 },
];
