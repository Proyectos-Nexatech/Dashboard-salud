### Informe de Requerimientos Técnicos: Plataforma de Visualización y Gestión de Riesgos en el Suministro Oncológico

#### 1\. Contexto Estratégico y Justificación del Proyecto

La disponibilidad de medicamentos oncológicos en Bogotá ha alcanzado un estado de crisis crítica. La capital concentra el 17,35% de las muertes por cáncer en Colombia, en un entorno donde las fallas en la cadena de suministro impiden que el 21,2% de los pacientes asegurados reciban sus prescripciones completas. Bajo este escenario, la digitalización y centralización de la red de suministro no es una opción operativa, sino una decisión estratégica imperativa para mitigar riesgos de salud pública y garantizar la continuidad de tratamientos de alto costo.El desabastecimiento crónico de principios activos esenciales, tales como la  **Citarabina**  (vital para leucemia mieloide aguda y sin sustituto), el  **5-fluorouracilo** , la  **Azatioprina** , el  **Clorambucilo**  y el  **Metotrexato** , genera perturbaciones sistémicas que obligan a las Instituciones Prestadoras de Servicios de Salud (IPS) a ejecutar operaciones contingentes de alto impacto financiero. Una plataforma centralizada es fundamental para transformar la capacidad de respuesta de las IPS, permitiendo pasar de una gestión reactiva ante cortes de suministro a una estrategia proactiva basada en datos.Para resolver esta problemática, el sistema debe estructurarse bajo los siguientes objetivos y requerimientos técnicos.

#### 2\. Objetivos del Sistema y Alcance Funcional

Es mandatorio alinear los objetivos técnicos con la estrategia de aprovisionamiento, equilibrando la eficiencia en costos con la capacidad de respuesta (flexibilidad y velocidad) para asegurar la resiliencia operativa. Basándose en el "Diseño metodológico para la gestión del riesgo", la plataforma debe cumplir con:

* **Caracterización automática del proceso de abasto:**  Identificación dinámica de la red, desde proveedores y centrales de preparación hasta el registro de procedimientos de quimioterapia (códigos CUPS).  
* **Evaluación multidimensional del riesgo:**  Valoración sistemática de factores internos (procesos y solidez financiera) y externos (geopolíticos y fluctuaciones de mercado).  
* **Simulación de escenarios mediante dinámica de sistemas:**  Modelado de flujos para comparar el "riesgo actual" frente a "estrategias de mitigación", analizando el impacto en niveles de servicio y sobrecostos.El cumplimiento de estos objetivos requiere una arquitectura de datos robusta que unifique fuentes heterogéneas.

#### 3\. Arquitectura de Datos e Integración de Fuentes

La visión holística de la cadena se logra mediante la integración de datos de ventas, ingresos y demografía. El sistema debe implementar los siguientes protocolos de integración:| Fuente de Datos | Especificación Técnica de Integración | Propósito Operativo || \------ | \------ | \------ || **Fuente Excel** | Ingesta mediante la biblioteca  *pandas*  utilizando el método read\_excel. | Procesamiento de históricos de ventas, ingresos, costos y cantidades por mes/producto. || **Populate Data (API)** | Consumo vía REST al endpoint: /populate-data-tutorials/datasets/dataset-name. Requiere parámetros filter\_by\_location\_id (ej. 28079\) y filter\_by\_date. | Obtención de datos del padrón municipal para proyecciones de demanda. Se debe referenciar la gema ine-places para códigos INE. || **Metadatos (JSON)** | Acceso vía URL: /populate-data-tutorials/datasets/dataset-name/metadata.json. | Definición de esquemas de dimensiones (sexo, edad) y frecuencias de actualización. |  
**Optimización de Rendimiento:**  Para prevenir el desperdicio de ancho de banda y optimizar la carga, las peticiones a la API deben incluir obligatoriamente el parámetro except\_columns para excluir campos innecesarios como \_id, province\_id, location\_id y autonomous\_region\_id.

#### 4\. Requerimientos de Visualización e Interactividad (Dashboard)

El dashboard debe reducir la asimetría de información mediante visualizaciones que faciliten la toma de decisiones bajo incertidumbre. Se exigen los siguientes componentes:

* **Gráficos de Barras Comparativos (Matplotlib/Plotly):**  El sistema debe procesar los datos de ingresos y costos mediante los métodos de pandas groupby('Mes', 'Producto') y agg({'Ingresos': 'sum', 'Costos': 'sum'}). Es obligatorio aplicar el método unstack() para transformar los datos de formato largo a columnas comparables por producto.  
* **Pirámides de Población (D3.js v5):**  El frontend debe utilizar  **D3.js versión 5**  para renderizar la demanda potencial bindeada a datos demográficos. El script debe calcular el atributo value\_pct (porcentaje del valor por sexo) para determinar el peso relativo de las cohortes en riesgo.  
* **Interactividad y Re-renderizado:**  La interfaz debe permitir filtros dinámicos por año, municipio y principio activo, con funciones de actualización en tiempo real que garanticen la integridad visual de los datos transformados.

#### 5\. Módulo Analítico: Evaluación y Mitigación de Riesgos

La plataforma debe integrar modelos de causalidad para predecir el comportamiento de inventarios. La configuración del módulo de riesgos debe seguir esta estructura:

1. **Factores Externos:**  Monitoreo de riesgos geopolíticos (especialmente en proveedores extranjeros), fluctuaciones de mercado (precios volátiles de combustibles y cambios cambiarios) y desastres naturales que afecten la logística.  
2. **Factores Internos:**  El sistema debe capturar datos sobre la  **solidez financiera**  de los actores, el  **cumplimiento de procedimientos de comunicación**  y la  **capacidad técnica**  de los proveedores y centrales de preparación.  
3. **Simulación de Escenarios:**  Modelado de "Estrategias de Mitigación" que permitan evaluar variaciones en las políticas de inventario y reglas de negociación para reducir los costos totales de operación y mejorar el nivel de oportunidad en la entrega.

#### 6\. Stack Tecnológico y Requerimientos No Funcionales

Se opta por un stack de código abierto para asegurar sostenibilidad y flexibilidad:

* **Lenguaje de Procesamiento:**  Python. Uso mandatorio de  *Pandas*  para la agregación lógica y  *Matplotlib/Plotly*  para el motor gráfico estático y dinámico.  
* **Frontend y Bindeo de Datos:**  D3.js v5 para la lógica de visualización personalizada y manejo de estructuras CSV/JSON.  
* **Protocolos de Integración:**  Soporte completo para REST API con manejo de metadatos JSON.  
* **Eficiencia de Datos:**  Exclusión selectiva de columnas en el origen (API side) para maximizar el rendimiento del renderizado en el cliente.

#### 7\. Conclusiones y Roadmap de Implementación

La implementación de esta plataforma constituye una herramienta de soporte vital para la continuidad de los tratamientos oncológicos en Bogotá. El éxito del proyecto se vincula directamente a:

1. **Mejora de Indicadores de Servicio:**  Reducción del 21,2% de recetas no entregadas mediante la anticipación de quiebres de stock en principios activos críticos.  
2. **Reducción de Sobrecostos Administrativos:**  Mitigación de los gastos derivados de operaciones de búsqueda contingente y compras de emergencia a precios de intermediación elevados.  
3. **Resiliencia Sistémica:**  Estabilización de la red de suministro frente a riesgos externos mediante políticas de inventario basadas en modelos de simulación científica y dinámica de sistemas.\# Informe de Requerimientos Técnicos: Plataforma de Visualización y Gestión de Riesgos en el Suministro Oncológico

#### 1\. Contexto Estratégico y Justificación del Proyecto

La disponibilidad de medicamentos oncológicos en Bogotá ha alcanzado un estado de crisis crítica. La capital concentra el 17,35% de las muertes por cáncer en Colombia, en un entorno donde las fallas en la cadena de suministro impiden que el 21,2% de los pacientes asegurados reciban sus prescripciones completas. Bajo este escenario, la digitalización y centralización de la red de suministro no es una opción operativa, sino una decisión estratégica imperativa para mitigar riesgos de salud pública y garantizar la continuidad de tratamientos de alto costo.El desabastecimiento crónico de principios activos esenciales, tales como la  **Citarabina**  (vital para leucemia mieloide aguda y sin sustituto), el  **5-fluorouracilo** , la  **Azatioprina** , el  **Clorambucilo**  y el  **Metotrexato** , genera perturbaciones sistémicas que obligan a las Instituciones Prestadoras de Servicios de Salud (IPS) a ejecutar operaciones contingentes de alto impacto financiero. Una plataforma centralizada es fundamental para transformar la capacidad de respuesta de las IPS, permitiendo pasar de una gestión reactiva ante cortes de suministro a una estrategia proactiva basada en datos.Para resolver esta problemática, el sistema debe estructurarse bajo los siguientes objetivos y requerimientos técnicos.

#### 2\. Objetivos del Sistema y Alcance Funcional

Es mandatorio alinear los objetivos técnicos con la estrategia de aprovisionamiento, equilibrando la eficiencia en costos con la capacidad de respuesta (flexibilidad y velocidad) para asegurar la resiliencia operativa. Basándose en el "Diseño metodológico para la gestión del riesgo", la plataforma debe cumplir con:

* **Caracterización automática del proceso de abasto:**  Identificación dinámica de la red, desde proveedores y centrales de preparación hasta el registro de procedimientos de quimioterapia (códigos CUPS).  
* **Evaluación multidimensional del riesgo:**  Valoración sistemática de factores internos (procesos y solidez financiera) y externos (geopolíticos y fluctuaciones de mercado).  
* **Simulación de escenarios mediante dinámica de sistemas:**  Modelado de flujos para comparar el "riesgo actual" frente a "estrategias de mitigación", analizando el impacto en niveles de servicio y sobrecostos.El cumplimiento de estos objetivos requiere una arquitectura de datos robusta que unifique fuentes heterogéneas.

#### 3\. Arquitectura de Datos e Integración de Fuentes

La visión holística de la cadena se logra mediante la integración de datos de ventas, ingresos y demografía. El sistema debe implementar los siguientes protocolos de integración:| Fuente de Datos | Especificación Técnica de Integración | Propósito Operativo || \------ | \------ | \------ || **Fuente Excel** | Ingesta mediante la biblioteca  *pandas*  utilizando el método read\_excel. | Procesamiento de históricos de ventas, ingresos, costos y cantidades por mes/producto. || **Populate Data (API)** | Consumo vía REST al endpoint: /populate-data-tutorials/datasets/dataset-name. Requiere parámetros filter\_by\_location\_id (ej. 28079\) y filter\_by\_date. | Obtención de datos del padrón municipal para proyecciones de demanda. Se debe referenciar la gema ine-places para códigos INE. || **Metadatos (JSON)** | Acceso vía URL: /populate-data-tutorials/datasets/dataset-name/metadata.json. | Definición de esquemas de dimensiones (sexo, edad) y frecuencias de actualización. |  
**Optimización de Rendimiento:**  Para prevenir el desperdicio de ancho de banda y optimizar la carga, las peticiones a la API deben incluir obligatoriamente el parámetro except\_columns para excluir campos innecesarios como \_id, province\_id, location\_id y autonomous\_region\_id.

#### 4\. Requerimientos de Visualización e Interactividad (Dashboard)

El dashboard debe reducir la asimetría de información mediante visualizaciones que faciliten la toma de decisiones bajo incertidumbre. Se exigen los siguientes componentes:

* **Gráficos de Barras Comparativos (Matplotlib/Plotly):**  El sistema debe procesar los datos de ingresos y costos mediante los métodos de pandas groupby('Mes', 'Producto') y agg({'Ingresos': 'sum', 'Costos': 'sum'}). Es obligatorio aplicar el método unstack() para transformar los datos de formato largo a columnas comparables por producto.  
* **Pirámides de Población (D3.js v5):**  El frontend debe utilizar  **D3.js versión 5**  para renderizar la demanda potencial bindeada a datos demográficos. El script debe calcular el atributo value\_pct (porcentaje del valor por sexo) para determinar el peso relativo de las cohortes en riesgo.  
* **Interactividad y Re-renderizado:**  La interfaz debe permitir filtros dinámicos por año, municipio y principio activo, con funciones de actualización en tiempo real que garanticen la integridad visual de los datos transformados.

#### 5\. Módulo Analítico: Evaluación y Mitigación de Riesgos

La plataforma debe integrar modelos de causalidad para predecir el comportamiento de inventarios. La configuración del módulo de riesgos debe seguir esta estructura:

1. **Factores Externos:**  Monitoreo de riesgos geopolíticos (especialmente en proveedores extranjeros), fluctuaciones de mercado (precios volátiles de combustibles y cambios cambiarios) y desastres naturales que afecten la logística.  
2. **Factores Internos:**  El sistema debe capturar datos sobre la  **solidez financiera**  de los actores, el  **cumplimiento de procedimientos de comunicación**  y la  **capacidad técnica**  de los proveedores y centrales de preparación.  
3. **Simulación de Escenarios:**  Modelado de "Estrategias de Mitigación" que permitan evaluar variaciones en las políticas de inventario y reglas de negociación para reducir los costos totales de operación y mejorar el nivel de oportunidad en la entrega.

#### 6\. Stack Tecnológico y Requerimientos No Funcionales

Se opta por un stack de código abierto para asegurar sostenibilidad y flexibilidad:

* **Lenguaje de Procesamiento:**  Python. Uso mandatorio de  *Pandas*  para la agregación lógica y  *Matplotlib/Plotly*  para el motor gráfico estático y dinámico.  
* **Frontend y Bindeo de Datos:**  D3.js v5 para la lógica de visualización personalizada y manejo de estructuras CSV/JSON.  
* **Protocolos de Integración:**  Soporte completo para REST API con manejo de metadatos JSON.  
* **Eficiencia de Datos:**  Exclusión selectiva de columnas en el origen (API side) para maximizar el rendimiento del renderizado en el cliente.

#### 7\. Conclusiones y Roadmap de Implementación

La implementación de esta plataforma constituye una herramienta de soporte vital para la continuidad de los tratamientos oncológicos en Bogotá. El éxito del proyecto se vincula directamente a:

1. **Mejora de Indicadores de Servicio:**  Reducción del 21,2% de recetas no entregadas mediante la anticipación de quiebres de stock en principios activos críticos.  
2. **Reducción de Sobrecostos Administrativos:**  Mitigación de los gastos derivados de operaciones de búsqueda contingente y compras de emergencia a precios de intermediación elevados.  
3. **Resiliencia Sistémica:**  Estabilización de la red de suministro frente a riesgos externos mediante políticas de inventario basadas en modelos de simulación científica y dinámica de sistemas.

