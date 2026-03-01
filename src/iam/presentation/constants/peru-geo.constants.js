/**
 * IAM Presentation Constants — Geografía de Perú
 *
 * Datos estáticos de departamentos, provincias y distritos del Perú.
 * Fuente: INEI — Lista referencial, no exhaustiva.
 *
 * Separado del componente para:
 *   - Evitar contaminar la vista con ~120 líneas de datos puros.
 *   - Potencialmente reutilizar desde un componente de perfil/dirección.
 *   - Facilitar actualización futura sin tocar lógica de presentación.
 */

export const PERU_DEPARTAMENTOS = [
    'Amazonas', 'Áncash', 'Apurímac', 'Arequipa', 'Ayacucho',
    'Cajamarca', 'Callao', 'Cusco', 'Huancavelica', 'Huánuco',
    'Ica', 'Junín', 'La Libertad', 'Lambayeque', 'Lima',
    'Loreto', 'Madre de Dios', 'Moquegua', 'Pasco', 'Piura',
    'Puno', 'San Martín', 'Tacna', 'Tumbes', 'Ucayali',
]

export const PERU_PROVINCIAS = {
    'Amazonas':      ['Chachapoyas','Bagua','Bongará','Condorcanqui','Luya','Rodríguez de Mendoza','Utcubamba'],
    'Áncash':        ['Huaraz','Aija','Antonio Raymondi','Asunción','Bolognesi','Carhuaz','Carlos Fitzcarrald','Casma','Corongo','Huari','Huarmey','Huaylas','Mariscal Luzuriaga','Ocros','Pallasca','Pomabamba','Recuay','Santa','Sihuas','Yungay'],
    'Apurímac':      ['Abancay','Andahuaylas','Antabamba','Aymaraes','Cotabambas','Chincheros','Grau'],
    'Arequipa':      ['Arequipa','Camaná','Caravelí','Castilla','Caylloma','Condesuyos','Islay','La Unión'],
    'Ayacucho':      ['Huamanga','Cangallo','Huanca Sancos','Huanta','La Mar','Lucanas','Parinacochas','Páucar del Sara Sara','Sucre','Víctor Fajardo','Vilcas Huamán'],
    'Cajamarca':     ['Cajamarca','Cajabamba','Celendín','Chota','Contumazá','Cutervo','Hualgayoc','Jaén','San Ignacio','San Marcos','San Miguel','San Pablo','Santa Cruz'],
    'Callao':        ['Callao'],
    'Cusco':         ['Cusco','Acomayo','Anta','Calca','Canas','Canchis','Chumbivilcas','Espinar','La Convención','Paruro','Paucartambo','Quispicanchi','Urubamba'],
    'Huancavelica':  ['Huancavelica','Acobamba','Angaraes','Castrovirreyna','Churcampa','Huaytará','Tayacaja'],
    'Huánuco':       ['Huánuco','Ambo','Dos de Mayo','Huacaybamba','Huamalíes','Leoncio Prado','Marañón','Pachitea','Puerto Inca','Lauricocha','Yarowilca'],
    'Ica':           ['Ica','Chincha','Nasca','Palpa','Pisco'],
    'Junín':         ['Huancayo','Chanchamayo','Chupaca','Concepción','Jauja','Junín','Satipo','Tarma','Yauli'],
    'La Libertad':   ['Trujillo','Ascope','Bolívar','Chepén','Julcán','Otuzco','Pacasmayo','Pataz','Sánchez Carrión','Santiago de Chuco','Gran Chimú','Virú'],
    'Lambayeque':    ['Chiclayo','Ferreñafe','Lambayeque'],
    'Lima':          ['Lima','Barranca','Cajatambo','Canta','Cañete','Huaral','Huarochirí','Huaura','Oyón','Yauyos'],
    'Loreto':        ['Maynas','Alto Amazonas','Datem del Marañón','Loreto','Mariscal Ramón Castilla','Putumayo','Requena','Ucayali'],
    'Madre de Dios': ['Tambopata','Manu','Tahuamanu'],
    'Moquegua':      ['Mariscal Nieto','General Sánchez Cerro','Ilo'],
    'Pasco':         ['Pasco','Daniel Alcides Carrión','Oxapampa'],
    'Piura':         ['Piura','Ayabaca','Huancabamba','Morropón','Paita','Sullana','Talara','Sechura'],
    'Puno':          ['Puno','Azángaro','Carabaya','Chucuito','El Collao','Huancané','Lampa','Melgar','Moho','San Antonio de Putina','San Román','Sandia','Yunguyo'],
    'San Martín':    ['Moyobamba','Bellavista','El Dorado','Huallaga','Lamas','Mariscal Cáceres','Picota','Rioja','San Martín','Tocache'],
    'Tacna':         ['Tacna','Candarave','Jorge Basadre','Tarata'],
    'Tumbes':        ['Tumbes','Contralmirante Villar','Zarumilla'],
    'Ucayali':       ['Coronel Portillo','Atalaya','Padre Abad','Purús'],
}

export const PERU_DISTRITOS = {
    'Lima':      ['Barranco','Breña','Carabayllo','Chorrillos','Cieneguilla','Comas','El Agustino','Independencia','Jesús María','La Molina','La Victoria','Lince','Los Olivos','Lurigancho','Lurín','Magdalena del Mar','Miraflores','Pachacámac','Pucusana','Pueblo Libre','Puente Piedra','Punta Hermosa','Punta Negra','Rímac','San Bartolo','San Borja','San Isidro','San Juan de Lurigancho','San Juan de Miraflores','San Luis','San Martín de Porres','San Miguel','Santa Anita','Santa María del Mar','Santa Rosa','Santiago de Surco','Surquillo','Villa El Salvador','Villa María del Triunfo'],
    'Callao':    ['Bellavista','Callao','Carmen de La Legua Reynoso','La Perla','La Punta','Mi Perú','Ventanilla'],
    'Arequipa':  ['Alto Selva Alegre','Arequipa','Cayma','Cerro Colorado','Characato','Chiguata','Jacobo Hunter','José Luis Bustamante y Rivero','La Joya','Mariano Melgar','Miraflores','Mollebaya','Paucarpata','Pocsi','Polobaya','Quequeña','Sabandia','Sachaca','San Juan de Siguas','San Juan de Tarucani','Santa Isabel de Siguas','Santa Rita de Siguas','Socabaya','Tiabaya','Uchumayo','Vitor','Yanahuara','Yarabamba','Yura'],
    'Cusco':     ['Ccorca','Cusco','Poroy','San Jerónimo','San Sebastián','Santiago','Saylla','Wanchaq'],
    'Trujillo':  ['El Porvenir','Florencia de Mora','Huanchaco','La Esperanza','Laredo','Moche','Poroto','Salaverry','Simbal','Trujillo','Víctor Larco Herrera'],
    'Chiclayo':  ['Chiclayo','Chongoyape','Eten','Eten Puerto','José Leonardo Ortiz','La Victoria','Lagunas','Monsefu','Nueva Arica','Oyotun','Picsi','Pimentel','Reque','Santa Rosa','Saña','Cayaltí','Pátapo','Pomalca','Pucalá','Tumán'],
    'Piura':     ['Castilla','Catacaos','Cura Mori','El Tallán','La Arena','La Unión','Las Lomas','Piura','Tambo Grande','Veintiseis de Octubre'],
    'Ica':       ['Ica','La Tinguiña','Los Aquijes','Ocucaje','Pueblo Nuevo','Salas','San José de Los Molinos','San Juan Bautista','Santiago','Subtanjalla','Tate','Yauca del Rosario'],
    'Huancayo':  ['Carhuacallanga','Chacapampa','Chicche','Chilca','Chongos Alto','Chupuro','Colca','Cullhuas','El Tambo','Huacrapuquio','Hualhuas','Huancán','Huancayo','Huasicancha','Huayucachi','Ingenio','Pariahuanca','Pucará','Quichuas','Quilcas','San Agustín de Cajas','San Jerónimo de Tunán','San Pedro de Saño','Santo Domingo de Acobamba','Sapallanga','Sicaya','Viques'],
    'Tacna':     ['Alto de la Alianza','Calana','Ciudad Nueva','Coronel Gregorio Albarracín Lanchipa','Inclán','Pachia','Palca','Pocollay','Sama','Tacna'],
    'Barranca':  ['Barranca','Cajatambo','Caleta de Carquín','Huacho','Hualmay','Huaura','Leoncio Prado','Paccho','Santa Leonor','Santa María','Supe','Supe Puerto','Végueta'],
    'Moyobamba': ['Calzada','Habana','Jepelacio','Moyobamba','Soritor'],
}

/** Fallback cuando la provincia elegida no tiene distritos mapeados */
export const PERU_DISTRITOS_DEFAULT = ['Capital de provincia']

/**
 * Tipos de documento de identidad válidos en Perú
 */
export const TIPOS_DOCUMENTO = ['DNI', 'CE', 'Pasaporte', 'RUC']
