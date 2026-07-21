/* ---------------- BANCO — dificultad "Difícil" · 100 opciones por categoría ---------------- */
const DIFICIL = {
  amarillo: [
    "Freddie Mercury","Frida Kahlo","Salvador Dalí","Charly García","Gustavo Cerati","Rasputín","Napoleón","Cleopatra","Gandhi","Beethoven",
    "Mozart","Albert Einstein","Isaac Newton","Charles Chaplin","Marilyn Monroe","Elvis Presley","Bob Marley","John Lennon","Michael Jackson","Madonna",
    "Lady Gaga","Shakira","Michael Jordan","Usain Bolt","Steve Jobs","Abraham Lincoln","Julio César","Juana de Arco","Cristóbal Colón","Marie Curie",
    "Vincent van Gogh","Pablo Picasso","William Shakespeare","Sigmund Freud","Gollum","Chewbacca","Yoda","Willy Wonka","El Zorro","Pikachu",
    "Mario Bros","Sherlock Holmes","Drácula","Frankenstein","Pinocho","Ornitorrinco","Suricata","Perezoso","Camaleón","Tucán",
    "Narval","Mandril","Pavo real","Ajolote","Erizo","Armadillo","Oso hormiguero","Puercoespín","Canguro","Morsa",
    "Pingüino emperador","Pelícano","Camello","Rinoceronte","Hipopótamo","Orangután","Mapache","Zorrino","Búho","Estrella de mar",
    "Cangrejo","Tortuga marina","Murciélago","Serpiente cascabel","Águila","Machu Picchu","Torre Eiffel","Cristo Redentor","Gran Muralla China","Perito Moreno",
    "Estatua de la Libertad","Coliseo Romano","Pirámides de Egipto","Torre de Pisa","Big Ben","Taj Mahal","Monte Everest","Cataratas del Niágara","Gran Cañón","Desierto del Sahara",
    "Polo Norte","Amazonas","Venecia","Times Square","Hollywood","Stonehenge","Aconcagua","Bariloche","Cataratas del Iguazú","Obelisco"
  ],
  azul: [
    "Máquina de coser","Telescopio","Acordeón","Matafuegos","Brújula","Balanza","Yunque","Batidora","Cortadora de césped","Máquina de escribir",
    "Cinta métrica","Trípode","Metrónomo","Regadera","Ancla","Candado","Serrucho","Broche de ropa","Sacacorchos","Embudo",
    "Molinillo de café","Ábaco","Fuelle","Caña de pescar","Estetoscopio","Catapulta","Reloj de arena","Periscopio","Taladro","Caleidoscopio",
    "Paraguas","Binoculares","Lupa","Termómetro","Jeringa","Microscopio","Máquina fotográfica","Tijeras de podar","Rallador","Exprimidor",
    "Batería","Violín","Arpa","Trompeta","Gaita","Xilófono","Pandereta","Cascanueces","Cortaúñas","Pinza para depilar",
    "Secador de pelo","Plancha de ropa","Aspiradora","Licuadora","Tostadora","Cafetera","Colador","Batidor de mano","Mortero","Pava",
    "Sartén","Wok","Cucharón","Espátula","Destornillador","Llave inglesa","Nivel de burbuja","Martillo","Sierra eléctrica","Soldador",
    "Manguera","Carretilla","Rastrillo","Pala","Hacha","Machete","Arco y flecha","Ballesta","Boomerang","Gomera",
    "Red de pesca","Salvavidas","Paracaídas","Sextante","Astrolabio","Gramófono","Tocadiscos","Radio antigua","Walkie-talkie","Megáfono",
    "Proyector","Globo terráqueo","Reloj cucú","Péndulo","Trampa para ratones","Sombrilla","Molinete","Cinta transportadora","Máquina expendedora","Soplador de hojas"
  ],
  naranja: [
    "Armar una carpa","Escapar de una abeja","Cambiar un neumático","Domar un caballo","Ordeñar una vaca","Hacer malabares","Trepar por una soga","Patinar sobre hielo","Remar en kayak","Hacer surf",
    "Cocinar un asado","Sacar una muela","Enhebrar una aguja","Espiar por una cerradura","Hacer dedo en la ruta","Amaestrar un perro","Torear","Hacer parkour","Caminar por la cuerda floja","Bucear",
    "Practicar esgrima","Lanzar jabalina","Saltar con garrocha","Encantar una serpiente","Volar en parapente","Escapar de arenas movedizas","Desactivar una bomba","Trasquilar una oveja","Pescar con arpón","Pelar una cebolla llorando",
    "Escalar una montaña","Escalar en hielo","Boxear","Hacer yoga","Meditar","Levantar pesas","Hacer flexiones","Saltar la soga","Tirar con arco","Jugar al bowling",
    "Jugar al golf","Jugar al tenis","Batear en béisbol","Hacer snowboard","Andar en monopatín","Andar en monociclo","Hacer equilibrio en una tabla","Domar un león","Herrar un caballo","Arar un campo",
    "Sembrar semillas","Cosechar trigo","Cortar leña","Encender una fogata","Pescar en el hielo","Cazar mariposas","Recoger manzanas","Exprimir naranjas","Amasar pan","Batir huevos",
    "Freír un huevo","Tender la ropa","Planchar una camisa","Coser un botón","Tejer una bufanda","Pintar un cuadro","Esculpir una estatua","Soplar vidrio","Moldear cerámica","Afilar un cuchillo",
    "Martillar un clavo","Serruchar una tabla","Pintar una pared","Empapelar una pared","Colocar ladrillos","Cavar un pozo","Podar un arbusto","Rastrillar hojas","Lavar un auto","Inflar una rueda",
    "Empujar un auto","Remar contra la corriente","Nadar mariposa","Zambullirse de cabeza","Hacer una voltereta","Saltar en paracaídas","Escapar de un perro","Correr de un toro","Espantar palomas","Atrapar una mosca",
    "Sacarse una astilla","Vendar una herida","Poner una inyección","Tomar la presión","Hipnotizar a alguien","Leer la palma de la mano","Adivinar el futuro","Hacer trucos de magia","Escapar de una camisa de fuerza","Caminar sobre brasas"
  ],
  verde: [
    "Titanic","Jurassic Park","El Rey León","Volver al Futuro","Piratas del Caribe","El Señor de los Anillos","Harry Potter","Matrix","Rápido y Furioso","Tiburón",
    "Shrek","Toy Story","Buscando a Nemo","Intensamente","Coco","Frozen","El Origen","Interestelar","It","El Conjuro",
    "Avatar","Rocky","Terminator","El Exorcista","Halloween","Scream","Actividad Paranormal","El Aro","Un lugar en silencio","Bird Box",
    "Parásitos","El Juego del Miedo","Mad Max","Duro de Matar","Misión Imposible","James Bond","Indiana Jones","King Kong","Godzilla","Los Cazafantasmas",
    "Hombres de Negro","El Día de la Independencia","Náufrago","Forrest Gump","En busca de la felicidad","El Lobo de Wall Street","Whiplash","La La Land","El Gran Hotel Budapest","Cisne Negro",
    "Joker","El Caballero de la Noche","Deadpool","Iron Man","Los Vengadores","Pantera Negra","Wonder Woman","Aquaman","Top Gun","Grease",
    "Dirty Dancing","El Guardaespaldas","Mi Pobre Angelito","El Grinch","Jumanji","Buscando a Dory","Ratatouille","Up: Una Aventura de Altura","Wall-E","Los Increíbles",
    "Kung Fu Panda","Madagascar","La Era de Hielo","Cómo Entrenar a tu Dragón","Mi Villano Favorito","Zootopia","Moana","Encanto","Enredados","La Sirenita",
    "La Bella y la Bestia","Aladdín","El Libro de la Selva","Bambi","Dumbo","Stranger Things","La Casa de Papel","Breaking Bad","Game of Thrones","The Walking Dead",
    "Los Simpson","Friends","Merlina","El Juego del Calamar","Rick y Morty","Peaky Blinders","The Office","Black Mirror","La Casa del Dragón","Los Locos Addams"
  ],
  rojo: [
    "Superman","Batman","Spider-Man","Dragón","Fantasma","Robot","Vampiro","Sirena","Elefante","Bailar reggaetón",
    "Tocar el piano","Semáforo","Tornado","Centauro","Minotauro","Unicornio","Medusa","Momia","Ninja","Espantapájaros",
    "Estatua viviente","Gladiador","Director de orquesta","Caballito de mar","Koala","Mago sacando un conejo","Caballero medieval","Tragafuegos","Jirafa","Pulpo",
    "Zombi","Bruja","Hada","Duende","Ogro","Cíclope","Genio de la lámpara","Payaso","Mimo","Malabarista",
    "Domador de leones","Astronauta","Buzo","Bombero","Policía de tránsito","Torero","Cowboy","Pirata","Caballero jedi","Superhéroe volando",
    "Robot bailando","Boxeador","Levantador de pesas","Nadador sincronizado","Esquiador","Surfista","Skater","Equilibrista","Trapecista","Contorsionista",
    "Faquir","Encantador de serpientes","Titiritero","Ventrílocuo","Robot descompuesto","Fantasma asustando","Vampiro mordiendo","Hombre lobo","Yeti","Ciempiés",
    "Escorpión","Tarántula","Mariposa","Abeja","Caracol","Rana saltando","Cangrejo caminando","Gorila golpeándose el pecho","León rugiendo","Serpiente reptando",
    "Águila volando","Pingüino caminando","Pato caminando","Gallina","Toro embistiendo","Caballo galopando","Mono rascándose","Rinoceronte cargando","Dinosaurio rugiendo","Dragón escupiendo fuego",
    "Golem de piedra","Trol","Gigante","Enano","Princesa","Rey","Reina","Bufón","Arquero medieval","Vikingo"
  ]
};

/* ---------------- BANCO — dificultad "Normal" · 20 opciones por categoría ----------------
   Palabras fáciles y conocidas, distintas a las de "Difícil". */
const NORMAL = {
  amarillo: [
    "Lionel Messi","Diego Maradona","Cristiano Ronaldo","Papá Noel","Mickey Mouse","Bob Esponja","Homero Simpson","El Chavo del 8","Neymar","Perro",
    "Gato","Vaca","Caballo","Conejo","Ratón","Cerdo","Tigre","Delfín","París","Playa"
  ],
  azul: [
    "Silla","Mesa","Teléfono","Televisor","Pelota","Reloj","Lápiz","Libro","Cuchara","Tenedor",
    "Cepillo de dientes","Almohada","Zapato","Sombrero","Llave","Botella","Peine","Escoba","Guitarra","Anteojos"
  ],
  naranja: [
    "Cepillarse los dientes","Manejar un auto","Tomar mate","Bailar","Cantar","Dormir","Cocinar","Barrer","Lavar los platos","Jugar al fútbol",
    "Sacar una foto","Peinarse","Nadar","Correr","Saltar la soga","Leer un libro","Escribir una carta","Regar las plantas","Planchar","Comer una pizza"
  ],
  verde: [
    "Cars","Minions","Peppa Pig","Pokémon","Dragon Ball","Barbie","Star Wars","Ben 10","Naruto","One Piece",
    "Los Pitufos","Scooby-Doo","Tom y Jerry","Patrulla Canina","Sonic","Los Padrinos Mágicos","Angry Birds","CoComelon","Garfield","Padre de Familia"
  ],
  rojo: [
    "Comer un helado","Reírse a carcajadas","Aplaudir","Estornudar","Bostezar","Saludar con la mano","Soplar velitas","Tomar sopa","Sacarse una selfie","Jugar a las cartas",
    "Perro persiguiendo su cola","Gato asustado","Pájaro volando","Pez nadando","Bebé gateando","Anciano con bastón","Festejar un gol","Chef cocinando","Cartero con una carta","Reírse tapándose la boca"
  ]
};

/* Bancos por dificultad. El motor elige según la dificultad seleccionada. */
export const BANKS = { normal: NORMAL, dificil: DIFICIL };
/* Compat: por defecto, el banco "Difícil". */
export const BANK = DIFICIL;
