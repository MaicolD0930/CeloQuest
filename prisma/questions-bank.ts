export type SeedQuestion = {
  category: "blockchain" | "wallets" | "celo" | "minipay" | "stablecoins" | "security";
  difficulty: 1 | 2 | 3;
  correctIndex: number;
  es: { text: string; options: string[]; explanation: string };
  en: { text: string; options: string[]; explanation: string };
};

export const questions: SeedQuestion[] = [
  // ========== DIFFICULTY 1 — BLOCKCHAIN (9) ==========
  {
    category: "blockchain",
    difficulty: 1,
    correctIndex: 1,
    es: {
      text: "¿Qué es una blockchain?",
      options: [
        "Una empresa de tecnología",
        "Un registro digital distribuido e inmutable de transacciones",
        "Un tipo de moneda física",
      ],
      explanation:
        "Una blockchain es un libro contable digital copiado en miles de computadoras; nadie puede borrarlo ni alterarlo.",
    },
    en: {
      text: "What is a blockchain?",
      options: [
        "A technology company",
        "A distributed, immutable digital ledger of transactions",
        "A type of physical coin",
      ],
      explanation:
        "A blockchain is a digital ledger copied across thousands of computers; no one can erase or alter it.",
    },
  },
  {
    category: "blockchain",
    difficulty: 1,
    correctIndex: 0,
    es: {
      text: "¿Qué significa que una blockchain sea 'descentralizada'?",
      options: [
        "Que no depende de una sola entidad o servidor central",
        "Que está ubicada en un solo país",
        "Que solo los bancos pueden usarla",
      ],
      explanation:
        "Descentralizada significa que miles de participantes mantienen la red sin un dueño único que la controle.",
    },
    en: {
      text: "What does it mean for a blockchain to be 'decentralized'?",
      options: [
        "It does not depend on a single entity or central server",
        "It is located in a single country",
        "Only banks can use it",
      ],
      explanation:
        "Decentralized means thousands of participants maintain the network with no single owner in control.",
    },
  },
  {
    category: "blockchain",
    difficulty: 1,
    correctIndex: 2,
    es: {
      text: "¿Qué es una transacción en blockchain?",
      options: [
        "Un correo electrónico cifrado",
        "Un documento legal impreso",
        "Una transferencia de valor registrada permanentemente en la red",
      ],
      explanation:
        "Cada envío de cripto queda registrado para siempre en la blockchain y cualquiera puede verificarlo.",
    },
    en: {
      text: "What is a blockchain transaction?",
      options: [
        "An encrypted email",
        "A printed legal document",
        "A transfer of value permanently recorded on the network",
      ],
      explanation:
        "Every crypto transfer is recorded forever on the blockchain and anyone can verify it.",
    },
  },
  {
    category: "blockchain",
    difficulty: 1,
    correctIndex: 0,
    es: {
      text: "¿Qué es un bloque en una blockchain?",
      options: [
        "Un grupo de transacciones empaquetadas y vinculadas al bloque anterior",
        "Un servidor central de datos",
        "Un tipo de wallet",
      ],
      explanation:
        "Los bloques encadenan transacciones en orden cronológico, formando la cadena inmutable.",
    },
    en: {
      text: "What is a block in a blockchain?",
      options: [
        "A group of transactions packaged and linked to the previous block",
        "A central data server",
        "A type of wallet",
      ],
      explanation:
        "Blocks chain transactions in chronological order, forming the immutable ledger.",
    },
  },
  {
    category: "blockchain",
    difficulty: 1,
    correctIndex: 1,
    es: {
      text: "¿Qué es un nodo en una red blockchain?",
      options: [
        "Un virus informático",
        "Una computadora que mantiene una copia de la blockchain",
        "Un token de gobernanza",
      ],
      explanation:
        "Los nodos validan y almacenan datos, manteniendo la red viva y descentralizada.",
    },
    en: {
      text: "What is a node in a blockchain network?",
      options: [
        "A computer virus",
        "A computer that maintains a copy of the blockchain",
        "A governance token",
      ],
      explanation:
        "Nodes validate and store data, keeping the network alive and decentralized.",
    },
  },
  {
    category: "blockchain",
    difficulty: 1,
    correctIndex: 2,
    es: {
      text: "¿Por qué se dice que la blockchain es inmutable?",
      options: [
        "Porque usa contraseñas fuertes",
        "Porque los datos están en la nube",
        "Porque alterar un bloque requeriría cambiar toda la cadena en miles de nodos",
      ],
      explanation:
        "Modificar un registro pasado es prácticamente imposible sin controlar la mayoría de la red.",
    },
    en: {
      text: "Why is a blockchain called immutable?",
      options: [
        "Because it uses strong passwords",
        "Because data is stored in the cloud",
        "Because changing one block would require altering the chain on thousands of nodes",
      ],
      explanation:
        "Altering past records is practically impossible without controlling most of the network.",
    },
  },
  {
    category: "blockchain",
    difficulty: 1,
    correctIndex: 1,
    es: {
      text: "¿Qué es Web3 en términos simples?",
      options: [
        "La tercera versión de un navegador web",
        "Internet donde los usuarios pueden poseer datos y valor digital",
        "Una red WiFi más rápida",
      ],
      explanation:
        "Web3 combina internet con blockchains para que controles tu dinero y datos sin intermediarios.",
    },
    en: {
      text: "What is Web3 in simple terms?",
      options: [
        "The third version of a web browser",
        "The internet where users can own data and digital value",
        "A faster WiFi network",
      ],
      explanation:
        "Web3 combines the internet with blockchains so you control your money and data without intermediaries.",
    },
  },
  {
    category: "blockchain",
    difficulty: 1,
    correctIndex: 0,
    es: {
      text: "¿Qué significa peer-to-peer (P2P) en blockchain?",
      options: [
        "Transferencias directas entre usuarios sin intermediario central",
        "Pagos solo entre bancos",
        "Comunicación por correo postal",
      ],
      explanation:
        "P2P permite enviar valor directamente de persona a persona a través de la red.",
    },
    en: {
      text: "What does peer-to-peer (P2P) mean in blockchain?",
      options: [
        "Direct transfers between users without a central intermediary",
        "Payments only between banks",
        "Communication by postal mail",
      ],
      explanation:
        "P2P lets you send value directly from person to person through the network.",
    },
  },
  {
    category: "blockchain",
    difficulty: 1,
    correctIndex: 2,
    es: {
      text: "¿Qué es un hash criptográfico?",
      options: [
        "Una moneda digital",
        "Una contraseña visible",
        "Una huella digital única generada a partir de datos",
      ],
      explanation:
        "El hash convierte información en un código único; cualquier cambio en los datos produce un hash distinto.",
    },
    en: {
      text: "What is a cryptographic hash?",
      options: [
        "A digital coin",
        "A visible password",
        "A unique digital fingerprint generated from data",
      ],
      explanation:
        "A hash turns information into a unique code; any data change produces a different hash.",
    },
  },

  // ========== DIFFICULTY 1 — WALLETS (8) ==========
  {
    category: "wallets",
    difficulty: 1,
    correctIndex: 1,
    es: {
      text: "¿Qué es una wallet (billetera digital)?",
      options: [
        "Una cuenta bancaria tradicional",
        "Una herramienta para guardar y gestionar tus criptoactivos",
        "Una tarjeta de crédito",
      ],
      explanation:
        "Una wallet guarda tus llaves privadas y te permite enviar, recibir y gestionar activos digitales.",
    },
    en: {
      text: "What is a wallet?",
      options: [
        "A traditional bank account",
        "A tool to store and manage your crypto assets",
        "A credit card",
      ],
      explanation:
        "A wallet stores your private keys and lets you send, receive, and manage digital assets.",
    },
  },
  {
    category: "wallets",
    difficulty: 1,
    correctIndex: 0,
    es: {
      text: "¿Qué es la frase de recuperación (seed phrase) de una wallet?",
      options: [
        "Una lista de palabras secretas que permite recuperar tu wallet",
        "El nombre de usuario de tu wallet",
        "Un código promocional",
      ],
      explanation:
        "La seed phrase son 12 o 24 palabras maestras; quien las tenga controla todos tus fondos.",
    },
    en: {
      text: "What is a wallet's recovery phrase (seed phrase)?",
      options: [
        "A list of secret words that lets you recover your wallet",
        "Your wallet's username",
        "A promo code",
      ],
      explanation:
        "The seed phrase is 12 or 24 master words; whoever has them controls all your funds.",
    },
  },
  {
    category: "wallets",
    difficulty: 1,
    correctIndex: 2,
    es: {
      text: "Si alguien te pide tu llave privada o seed phrase, ¿qué debes hacer?",
      options: [
        "Compartirla si parece confiable",
        "Enviarla solo por WhatsApp",
        "Nunca compartirla: quien la tenga controla tus fondos",
      ],
      explanation:
        "Ningún soporte legítimo te pedirá tu llave privada o seed phrase.",
    },
    en: {
      text: "If someone asks for your private key or seed phrase, what should you do?",
      options: [
        "Share it if they seem trustworthy",
        "Only send it via WhatsApp",
        "Never share it: whoever has it controls your funds",
      ],
      explanation:
        "No legitimate support team will ever ask for your private key or seed phrase.",
    },
  },
  {
    category: "wallets",
    difficulty: 1,
    correctIndex: 1,
    es: {
      text: "¿Qué es una llave privada?",
      options: [
        "Tu dirección pública visible",
        "Una clave secreta que firma transacciones y prueba propiedad",
        "Un código QR decorativo",
      ],
      explanation:
        "La llave privada autoriza movimientos de fondos y debe guardarse en secreto.",
    },
    en: {
      text: "What is a private key?",
      options: [
        "Your visible public address",
        "A secret key that signs transactions and proves ownership",
        "A decorative QR code",
      ],
      explanation:
        "The private key authorizes fund movements and must be kept secret.",
    },
  },
  {
    category: "wallets",
    difficulty: 1,
    correctIndex: 0,
    es: {
      text: "¿Qué es una dirección pública de wallet?",
      options: [
        "Un identificador que puedes compartir para recibir fondos",
        "Tu contraseña secreta",
        "Tu número de documento de identidad",
      ],
      explanation:
        "Compartir tu dirección pública es seguro; compartir tu llave privada nunca lo es.",
    },
    en: {
      text: "What is a wallet's public address?",
      options: [
        "An identifier you can share to receive funds",
        "Your secret password",
        "Your ID number",
      ],
      explanation:
        "Sharing your public address is safe; sharing your private key never is.",
    },
  },
  {
    category: "wallets",
    difficulty: 1,
    correctIndex: 2,
    es: {
      text: "¿Qué es una wallet caliente (hot wallet)?",
      options: [
        "Una wallet física de metal",
        "Una wallet que solo funciona sin internet",
        "Una wallet conectada a internet para uso diario",
      ],
      explanation:
        "Las hot wallets son convenientes para pagos frecuentes pero deben usarse con buenas prácticas de seguridad.",
    },
    en: {
      text: "What is a hot wallet?",
      options: [
        "A metal physical wallet",
        "A wallet that only works offline",
        "A wallet connected to the internet for daily use",
      ],
      explanation:
        "Hot wallets are convenient for frequent payments but require good security habits.",
    },
  },
  {
    category: "wallets",
    difficulty: 1,
    correctIndex: 1,
    es: {
      text: "¿Para qué sirve un código QR en pagos cripto?",
      options: [
        "Decorar la pantalla del celular",
        "Codificar una dirección de wallet para escanear y pagar fácilmente",
        "Encriptar la seed phrase",
      ],
      explanation:
        "Escanear un QR reduce errores al copiar direcciones largas manualmente.",
    },
    en: {
      text: "What is a QR code used for in crypto payments?",
      options: [
        "Decorate the phone screen",
        "Encode a wallet address for easy scan-and-pay",
        "Encrypt the seed phrase",
      ],
      explanation:
        "Scanning a QR reduces errors when copying long addresses manually.",
    },
  },
  {
    category: "wallets",
    difficulty: 1,
    correctIndex: 0,
    es: {
      text: "¿Qué significa 'not your keys, not your crypto'?",
      options: [
        "Si no controlas tus llaves, no controlas realmente tus fondos",
        "Debes tener muchas llaves físicas",
        "El banco siempre protege tus criptoactivos",
      ],
      explanation:
        "Quien controla las llaves privadas controla los activos, sin importar quién los 'guarda'.",
    },
    en: {
      text: "What does 'not your keys, not your crypto' mean?",
      options: [
        "If you don't control your keys, you don't truly control your funds",
        "You must own many physical keys",
        "The bank always protects your crypto",
      ],
      explanation:
        "Whoever controls the private keys controls the assets, regardless of who 'holds' them.",
    },
  },

  // ========== DIFFICULTY 1 — CELO (8) ==========
  {
    category: "celo",
    difficulty: 1,
    correctIndex: 1,
    es: {
      text: "¿Qué es Celo?",
      options: [
        "Una red social",
        "Una blockchain enfocada en pagos móviles y accesibilidad global",
        "Un banco digital de Colombia",
      ],
      explanation:
        "Celo es una blockchain diseñada para que cualquier persona con celular acceda a herramientas financieras simples y baratas.",
    },
    en: {
      text: "What is Celo?",
      options: [
        "A social network",
        "A blockchain focused on mobile payments and global accessibility",
        "A digital bank from Colombia",
      ],
      explanation:
        "Celo is a blockchain designed so anyone with a phone can access simple, affordable financial tools.",
    },
  },
  {
    category: "celo",
    difficulty: 1,
    correctIndex: 0,
    es: {
      text: "¿Qué hace especial a Celo frente a otras blockchains?",
      options: [
        "Está optimizada para celulares y tiene comisiones muy bajas",
        "Solo funciona en computadoras de escritorio",
        "Requiere equipos de minería costosos",
      ],
      explanation:
        "Celo nació con visión mobile-first: transacciones rápidas y gas pagadero con stablecoins.",
    },
    en: {
      text: "What makes Celo special compared to other blockchains?",
      options: [
        "It is optimized for mobile phones and has very low fees",
        "It only works on desktop computers",
        "It requires expensive mining equipment",
      ],
      explanation:
        "Celo was built mobile-first: fast transactions and gas payable with stablecoins.",
    },
  },
  {
    category: "celo",
    difficulty: 1,
    correctIndex: 2,
    es: {
      text: "¿Cuál es el token nativo de la red Celo?",
      options: ["BTC", "ETH", "CELO"],
      explanation:
        "CELO se usa para staking, gobernanza y tarifas de red dentro del ecosistema Celo.",
    },
    en: {
      text: "What is the native token of the Celo network?",
      options: ["BTC", "ETH", "CELO"],
      explanation:
        "CELO is used for staking, governance, and network fees within the Celo ecosystem.",
    },
  },
  {
    category: "celo",
    difficulty: 1,
    correctIndex: 1,
    es: {
      text: "¿A quién está orientada principalmente Celo?",
      options: [
        "Solo a grandes bancos internacionales",
        "A personas con teléfono móvil, incluidos quienes no tienen acceso bancario tradicional",
        "Solo a mineros profesionales",
      ],
      explanation:
        "La misión de Celo es 'prosperidad para todos' mediante finanzas móviles inclusivas.",
    },
    en: {
      text: "Who is Celo primarily designed for?",
      options: [
        "Large international banks only",
        "People with mobile phones, including those without traditional banking",
        "Professional miners only",
      ],
      explanation:
        "Celo's mission is 'prosperity for all' through inclusive mobile finance.",
    },
  },
  {
    category: "celo",
    difficulty: 1,
    correctIndex: 0,
    es: {
      text: "¿Celo es compatible con herramientas de Ethereum?",
      options: [
        "Sí, usa EVM y Solidity como Ethereum",
        "No, es totalmente incompatible",
        "Solo funciona con Bitcoin",
      ],
      explanation:
        "La compatibilidad EVM permite a desarrolladores usar herramientas familiares en Celo.",
    },
    en: {
      text: "Is Celo compatible with Ethereum tooling?",
      options: [
        "Yes, it uses EVM and Solidity like Ethereum",
        "No, it is fully incompatible",
        "It only works with Bitcoin",
      ],
      explanation:
        "EVM compatibility lets developers use familiar tools on Celo.",
    },
  },
  {
    category: "celo",
    difficulty: 1,
    correctIndex: 2,
    es: {
      text: "¿Qué significa 'mobile-first' en Celo?",
      options: [
        "Que solo hay apps para tablets",
        "Que elimina las computadoras del ecosistema",
        "Que prioriza la experiencia en smartphones para pagos cotidianos",
      ],
      explanation:
        "Celo permite asociar wallets a números telefónicos para pagos más intuitivos.",
    },
    en: {
      text: "What does 'mobile-first' mean for Celo?",
      options: [
        "Tablet-only apps",
        "Computers are removed from the ecosystem",
        "It prioritizes smartphone experience for everyday payments",
      ],
      explanation:
        "Celo lets you link wallets to phone numbers for more intuitive payments.",
    },
  },
  {
    category: "celo",
    difficulty: 1,
    correctIndex: 1,
    es: {
      text: "¿Qué es Alfajores en el ecosistema Celo?",
      options: [
        "Un dulce argentino",
        "La red de prueba (testnet) de Celo",
        "Un exchange centralizado",
      ],
      explanation:
        "Alfajores permite probar apps y transacciones sin usar dinero real.",
    },
    en: {
      text: "What is Alfajores in the Celo ecosystem?",
      options: [
        "An Argentine dessert",
        "Celo's testnet",
        "A centralized exchange",
      ],
      explanation:
        "Alfajores lets you test apps and transactions without using real money.",
    },
  },
  {
    category: "celo",
    difficulty: 1,
    correctIndex: 0,
    es: {
      text: "¿Cuál es la misión principal de la fundación Celo?",
      options: [
        "Crear prosperidad para todos con herramientas financieras accesibles",
        "Vender teléfonos móviles",
        "Reemplazar internet completamente",
      ],
      explanation:
        "Celo busca llevar finanzas digitales a quienes tienen celular pero no acceso bancario.",
    },
    en: {
      text: "What is the main mission of the Celo Foundation?",
      options: [
        "Create prosperity for all with accessible financial tools",
        "Sell mobile phones",
        "Replace the internet entirely",
      ],
      explanation:
        "Celo aims to bring digital finance to people with phones but no banking access.",
    },
  },

  // ========== DIFFICULTY 1 — MINIPAY (8) ==========
  {
    category: "minipay",
    difficulty: 1,
    correctIndex: 1,
    es: {
      text: "¿Qué es MiniPay?",
      options: [
        "Un banco tradicional africano",
        "Una wallet ligera integrada en WhatsApp para pagos con stablecoins en Celo",
        "Una red de minería de Bitcoin",
      ],
      explanation:
        "MiniPay permite enviar y recibir dinero digital desde WhatsApp sin instalar apps complejas.",
    },
    en: {
      text: "What is MiniPay?",
      options: [
        "A traditional African bank",
        "A lightweight wallet integrated in WhatsApp for stablecoin payments on Celo",
        "A Bitcoin mining network",
      ],
      explanation:
        "MiniPay lets you send and receive digital money from WhatsApp without complex apps.",
    },
  },
  {
    category: "minipay",
    difficulty: 1,
    correctIndex: 0,
    es: {
      text: "¿En qué blockchain funciona MiniPay?",
      options: ["Celo", "Bitcoin", "Solana"],
      explanation:
        "MiniPay aprovecha las bajas comisiones y stablecoins nativas de la red Celo.",
    },
    en: {
      text: "Which blockchain does MiniPay run on?",
      options: ["Celo", "Bitcoin", "Solana"],
      explanation:
        "MiniPay leverages Celo's low fees and native stablecoins.",
    },
  },
  {
    category: "minipay",
    difficulty: 1,
    correctIndex: 2,
    es: {
      text: "¿Qué ventaja principal ofrece MiniPay a usuarios nuevos?",
      options: [
        "Requiere hardware especializado",
        "Solo funciona con tarjetas de crédito",
        "Acceso a pagos digitales desde una app que ya usan (WhatsApp)",
      ],
      explanation:
        "MiniPay reduce la barrera de entrada al no exigir instalar una wallet separada.",
    },
    en: {
      text: "What main advantage does MiniPay offer new users?",
      options: [
        "It requires specialized hardware",
        "It only works with credit cards",
        "Access to digital payments from an app they already use (WhatsApp)",
      ],
      explanation:
        "MiniPay lowers the barrier by not requiring a separate wallet install.",
    },
  },
  {
    category: "minipay",
    difficulty: 1,
    correctIndex: 1,
    es: {
      text: "¿Qué tipo de moneda usa MiniPay principalmente?",
      options: [
        "Solo Bitcoin",
        "Stablecoins como cUSD atadas al dólar",
        "Monedas físicas de papel",
      ],
      explanation:
        "Las stablecoins evitan la volatilidad extrema, ideal para pagos del día a día.",
    },
    en: {
      text: "What type of currency does MiniPay primarily use?",
      options: [
        "Bitcoin only",
        "Stablecoins like cUSD pegged to the dollar",
        "Physical paper money",
      ],
      explanation:
        "Stablecoins avoid extreme volatility, making them ideal for everyday payments.",
    },
  },
  {
    category: "minipay",
    difficulty: 1,
    correctIndex: 0,
    es: {
      text: "¿MiniPay es custodial o no custodial?",
      options: [
        "No custodial: el usuario controla sus fondos",
        "Custodial: un banco guarda todo",
        "No tiene fondos, solo mensajes",
      ],
      explanation:
        "En MiniPay tú controlas tu wallet; nadie más puede mover tus fondos sin tu autorización.",
    },
    en: {
      text: "Is MiniPay custodial or non-custodial?",
      options: [
        "Non-custodial: the user controls their funds",
        "Custodial: a bank holds everything",
        "It has no funds, only messages",
      ],
      explanation:
        "With MiniPay you control your wallet; no one else can move your funds without authorization.",
    },
  },
  {
    category: "minipay",
    difficulty: 1,
    correctIndex: 2,
    es: {
      text: "¿Para qué mercados fue pensado MiniPay?",
      options: [
        "Solo Wall Street",
        "Solo Europa del Norte",
        "Mercados emergentes con alta adopción móvil y WhatsApp",
      ],
      explanation:
        "MiniPay prioriza regiones donde el celular es la principal puerta de acceso a internet y pagos.",
    },
    en: {
      text: "Which markets was MiniPay designed for?",
      options: [
        "Wall Street only",
        "Northern Europe only",
        "Emerging markets with high mobile and WhatsApp adoption",
      ],
      explanation:
        "MiniPay prioritizes regions where phones are the main gateway to internet and payments.",
    },
  },
  {
    category: "minipay",
    difficulty: 1,
    correctIndex: 1,
    es: {
      text: "¿Cómo se envía dinero con MiniPay?",
      options: [
        "Solo por correo postal",
        "A través de conversaciones de WhatsApp con comandos o botones simples",
        "Mediante fax bancario",
      ],
      explanation:
        "MiniPay integra pagos en el flujo de chat, haciendo las transferencias tan simples como enviar un mensaje.",
    },
    en: {
      text: "How do you send money with MiniPay?",
      options: [
        "Only by postal mail",
        "Through WhatsApp chats with simple commands or buttons",
        "Via bank fax",
      ],
      explanation:
        "MiniPay embeds payments in chat, making transfers as simple as sending a message.",
    },
  },
  {
    category: "minipay",
    difficulty: 1,
    correctIndex: 0,
    es: {
      text: "¿MiniPay necesita una computadora de escritorio?",
      options: [
        "No, funciona completamente desde el celular",
        "Sí, siempre requiere PC",
        "Solo funciona en televisores inteligentes",
      ],
      explanation:
        "MiniPay es mobile-first: todo el flujo ocurre en el smartphone del usuario.",
    },
    en: {
      text: "Does MiniPay need a desktop computer?",
      options: [
        "No, it works entirely from a mobile phone",
        "Yes, it always requires a PC",
        "It only works on smart TVs",
      ],
      explanation:
        "MiniPay is mobile-first: the entire flow happens on the user's smartphone.",
    },
  },

  // ========== DIFFICULTY 1 — STABLECOINS (8) ==========
  {
    category: "stablecoins",
    difficulty: 1,
    correctIndex: 1,
    es: {
      text: "¿Qué es una stablecoin?",
      options: [
        "Una moneda muy volátil",
        "Una criptomoneda diseñada para mantener un valor estable respecto a una moneda fiduciaria",
        "Una moneda que solo sube de precio",
      ],
      explanation:
        "Las stablecoins buscan paridad con activos como el dólar para facilitar pagos y ahorro.",
    },
    en: {
      text: "What is a stablecoin?",
      options: [
        "A highly volatile coin",
        "A cryptocurrency designed to maintain stable value relative to a fiat currency",
        "A coin that only goes up in price",
      ],
      explanation:
        "Stablecoins aim for parity with assets like the dollar to enable payments and savings.",
    },
  },
  {
    category: "stablecoins",
    difficulty: 1,
    correctIndex: 0,
    es: {
      text: "¿Por qué son útiles las stablecoins para pagos cotidianos?",
      options: [
        "Porque su precio es predecible y no cambia drásticamente de un día a otro",
        "Porque no se pueden transferir",
        "Porque solo funcionan en bancos",
      ],
      explanation:
        "Sin volatilidad extrema, puedes pagar un café sabiendo que el valor no cambiará antes de confirmar.",
    },
    en: {
      text: "Why are stablecoins useful for everyday payments?",
      options: [
        "Because their price is predictable and doesn't swing drastically day to day",
        "Because they cannot be transferred",
        "Because they only work in banks",
      ],
      explanation:
        "Without extreme volatility, you can pay for coffee knowing the value won't change before confirmation.",
    },
  },
  {
    category: "stablecoins",
    difficulty: 1,
    correctIndex: 2,
    es: {
      text: "¿Qué es cUSD en Celo?",
      options: [
        "El token de gobernanza de Celo",
        "Un NFT coleccionable",
        "Una stablecoin atada al dólar estadounidense",
      ],
      explanation:
        "cUSD mantiene paridad aproximada de 1:1 con el USD, ideal para pagos en Celo.",
    },
    en: {
      text: "What is cUSD on Celo?",
      options: [
        "Celo's governance token",
        "A collectible NFT",
        "A stablecoin pegged to the US dollar",
      ],
      explanation:
        "cUSD maintains approximately 1:1 parity with USD, ideal for payments on Celo.",
    },
  },
  {
    category: "stablecoins",
    difficulty: 1,
    correctIndex: 1,
    es: {
      text: "¿A qué moneda está atada cEUR?",
      options: ["Dólar estadounidense", "Euro", "Peso mexicano"],
      explanation:
        "cEUR es la stablecoin de Celo diseñada para mantener paridad con el euro.",
    },
    en: {
      text: "Which currency is cEUR pegged to?",
      options: ["US dollar", "Euro", "Mexican peso"],
      explanation:
        "cEUR is Celo's stablecoin designed to maintain parity with the euro.",
    },
  },
  {
    category: "stablecoins",
    difficulty: 1,
    correctIndex: 0,
    es: {
      text: "¿Qué significa 'peg' en el contexto de stablecoins?",
      options: [
        "La paridad o ancla de precio respecto a un activo de referencia",
        "Un tipo de wallet",
        "Una comisión de red",
      ],
      explanation:
        "Mantener el peg significa que 1 stablecoin ≈ 1 unidad de la moneda de referencia.",
    },
    en: {
      text: "What does 'peg' mean for stablecoins?",
      options: [
        "The price parity or anchor to a reference asset",
        "A type of wallet",
        "A network fee",
      ],
      explanation:
        "Maintaining the peg means 1 stablecoin ≈ 1 unit of the reference currency.",
    },
  },
  {
    category: "stablecoins",
    difficulty: 1,
    correctIndex: 2,
    es: {
      text: "¿Cuál es una ventaja de usar stablecoins sobre Bitcoin para pagar un alquiler?",
      options: [
        "Bitcoin siempre vale exactamente 1 dólar",
        "Las stablecoins son imposibles de enviar",
        "El valor en dólares de la stablecoin no fluctúa tanto como Bitcoin",
      ],
      explanation:
        "Para obligaciones fijas en moneda local, la estabilidad de precio es fundamental.",
    },
    en: {
      text: "What is an advantage of stablecoins over Bitcoin for paying rent?",
      options: [
        "Bitcoin is always worth exactly one dollar",
        "Stablecoins cannot be sent",
        "The dollar value of a stablecoin doesn't fluctuate as much as Bitcoin",
      ],
      explanation:
        "For fixed obligations in local currency, price stability is essential.",
    },
  },
  {
    category: "stablecoins",
    difficulty: 1,
    correctIndex: 1,
    es: {
      text: "¿Qué es USDC?",
      options: [
        "Un token de gobernanza de Celo",
        "Una stablecoin respaldada por reservas y ampliamente usada",
        "Una moneda física de Estados Unidos",
      ],
      explanation:
        "USDC es una stablecoin popular disponible también en la red Celo para pagos y DeFi.",
    },
    en: {
      text: "What is USDC?",
      options: [
        "A Celo governance token",
        "A reserve-backed stablecoin widely used across networks",
        "Physical US currency",
      ],
      explanation:
        "USDC is a popular reserve-backed stablecoin also available on Celo for payments and DeFi.",
    },
  },
  {
    category: "stablecoins",
    difficulty: 1,
    correctIndex: 0,
    es: {
      text: "¿Las stablecoins viven en la blockchain?",
      options: [
        "Sí, son tokens que se transfieren on-chain como cualquier criptoactivo",
        "No, solo existen en papel",
        "Solo existen en bancos tradicionales",
      ],
      explanation:
        "Stablecoins como cUSD son tokens ERC-20 transferibles en la red Celo.",
    },
    en: {
      text: "Do stablecoins live on the blockchain?",
      options: [
        "Yes, they are tokens transferred on-chain like any crypto asset",
        "No, they only exist on paper",
        "They only exist in traditional banks",
      ],
      explanation:
        "Stablecoins like cUSD are ERC-20 tokens transferable on the Celo network.",
    },
  },

  // ========== DIFFICULTY 1 — SECURITY (9) ==========
  {
    category: "security",
    difficulty: 1,
    correctIndex: 2,
    es: {
      text: "¿Cuál es la regla de oro de seguridad en Web3?",
      options: [
        "Compartir tu seed phrase con soporte técnico",
        "Usar la misma contraseña en todas partes",
        "Nunca compartir tu llave privada ni frase de recuperación con nadie",
      ],
      explanation:
        "Quien tiene tu seed phrase tiene acceso total a tus fondos, sin posibilidad de recuperación bancaria.",
    },
    en: {
      text: "What is the golden rule of Web3 security?",
      options: [
        "Share your seed phrase with tech support",
        "Use the same password everywhere",
        "Never share your private key or recovery phrase with anyone",
      ],
      explanation:
        "Whoever has your seed phrase has full access to your funds with no bank-style recovery.",
    },
  },
  {
    category: "security",
    difficulty: 1,
    correctIndex: 0,
    es: {
      text: "¿Qué es un scam (estafa) cripto común?",
      options: [
        "Promesas de duplicar tu dinero si envías cripto primero",
        "Una comisión normal de red",
        "Un tipo de stablecoin",
      ],
      explanation:
        "Si suena demasiado bueno para ser verdad, probablemente es una estafa; nunca envíes fondos a desconocidos.",
    },
    en: {
      text: "What is a common crypto scam?",
      options: [
        "Promises to double your money if you send crypto first",
        "A normal network fee",
        "A type of stablecoin",
      ],
      explanation:
        "If it sounds too good to be true, it probably is; never send funds to strangers.",
    },
  },
  {
    category: "security",
    difficulty: 1,
    correctIndex: 1,
    es: {
      text: "¿Dónde debes guardar tu seed phrase?",
      options: [
        "En un mensaje de WhatsApp a ti mismo",
        "En un lugar offline seguro, como papel en una caja fuerte",
        "Como foto pública en Instagram",
      ],
      explanation:
        "La seed phrase debe estar offline y fuera de dispositivos conectados a internet.",
    },
    en: {
      text: "Where should you store your seed phrase?",
      options: [
        "In a WhatsApp message to yourself",
        "In a secure offline place, like paper in a safe",
        "As a public photo on Instagram",
      ],
      explanation:
        "Your seed phrase should be offline and off internet-connected devices.",
    },
  },
  {
    category: "security",
    difficulty: 1,
    correctIndex: 2,
    es: {
      text: "¿Qué debes verificar antes de instalar una wallet?",
      options: [
        "Que tenga colores bonitos",
        "Que la recomiende un desconocido en un chat",
        "Que provenga de la tienda oficial o sitio web verificado del desarrollador",
      ],
      explanation:
        "Apps falsas imitan wallets reales para robar seed phrases; descarga solo de fuentes oficiales.",
    },
    en: {
      text: "What should you verify before installing a wallet?",
      options: [
        "That it has nice colors",
        "That a stranger in a chat recommends it",
        "That it comes from the official store or verified developer website",
      ],
      explanation:
        "Fake apps mimic real wallets to steal seed phrases; download only from official sources.",
    },
  },
  {
    category: "security",
    difficulty: 1,
    correctIndex: 0,
    es: {
      text: "¿Qué es phishing en cripto?",
      options: [
        "Sitios o mensajes falsos que imitan servicios legítimos para robar credenciales",
        "Un protocolo de consenso",
        "Un tipo de minería ecológica",
      ],
      explanation:
        "Verifica siempre la URL y nunca ingreses tu seed phrase en sitios web.",
    },
    en: {
      text: "What is crypto phishing?",
      options: [
        "Fake sites or messages mimicking legitimate services to steal credentials",
        "A consensus protocol",
        "A type of green mining",
      ],
      explanation:
        "Always verify URLs and never enter your seed phrase on websites.",
    },
  },
  {
    category: "security",
    difficulty: 1,
    correctIndex: 1,
    es: {
      text: "¿Por qué las transacciones blockchain son irreversibles?",
      options: [
        "Porque los bancos las cancelan en 24 horas",
        "Porque no hay un intermediario central que pueda revertirlas",
        "Porque usan papel moneda",
      ],
      explanation:
        "Una vez confirmada, una transacción no se puede deshacer; verifica siempre el destinatario.",
    },
    en: {
      text: "Why are blockchain transactions irreversible?",
      options: [
        "Because banks cancel them within 24 hours",
        "Because there is no central intermediary that can reverse them",
        "Because they use paper money",
      ],
      explanation:
        "Once confirmed, a transaction cannot be undone; always verify the recipient.",
    },
  },
  {
    category: "security",
    difficulty: 1,
    correctIndex: 2,
    es: {
      text: "¿Qué hacer si alguien te promete 'airdrop gratis' pidiendo tu seed phrase?",
      options: [
        "Enviarla rápido antes de que expire",
        "Compartirla solo con amigos",
        "Ignorarlo: es una estafa, nadie legítimo pide tu seed phrase",
      ],
      explanation:
        "Los airdrops reales nunca requieren tu frase de recuperación.",
    },
    en: {
      text: "What to do if someone promises a 'free airdrop' asking for your seed phrase?",
      options: [
        "Send it quickly before it expires",
        "Share it only with friends",
        "Ignore it: it's a scam, no legitimate party asks for your seed phrase",
      ],
      explanation:
        "Real airdrops never require your recovery phrase.",
    },
  },
  {
    category: "security",
    difficulty: 1,
    correctIndex: 0,
    es: {
      text: "¿Qué es autenticación de dos factores (2FA)?",
      options: [
        "Una capa extra de seguridad además de tu contraseña",
        "Un tipo de stablecoin",
        "Un explorador de bloques",
      ],
      explanation:
        "2FA protege cuentas centralizadas (exchanges, email) con un segundo código de verificación.",
    },
    en: {
      text: "What is two-factor authentication (2FA)?",
      options: [
        "An extra security layer beyond your password",
        "A type of stablecoin",
        "A block explorer",
      ],
      explanation:
        "2FA protects centralized accounts (exchanges, email) with a second verification code.",
    },
  },
  {
    category: "security",
    difficulty: 1,
    correctIndex: 1,
    es: {
      text: "¿Es seguro compartir tu dirección pública de wallet?",
      options: [
        "No, nunca compartir nada de tu wallet",
        "Sí, la dirección pública está diseñada para recibir fondos",
        "Solo si la encriptas con contraseña",
      ],
      explanation:
        "La dirección pública es como tu número de cuenta; la llave privada es lo que nunca debes compartir.",
    },
    en: {
      text: "Is it safe to share your public wallet address?",
      options: [
        "No, never share anything about your wallet",
        "Yes, the public address is designed to receive funds",
        "Only if you encrypt it with a password",
      ],
      explanation:
        "The public address is like your account number; the private key is what you must never share.",
    },
  },

  // ========== DIFFICULTY 2 — BLOCKCHAIN (8) ==========
  {
    category: "blockchain",
    difficulty: 2,
    correctIndex: 1,
    es: {
      text: "¿Qué es un smart contract (contrato inteligente)?",
      options: [
        "Un contrato firmado por un abogado experto",
        "Un programa que se ejecuta automáticamente en la blockchain",
        "Un acuerdo verbal entre dos personas",
      ],
      explanation:
        "Un smart contract es código on-chain que se ejecuta solo cuando se cumplen condiciones predefinidas.",
    },
    en: {
      text: "What is a smart contract?",
      options: [
        "A contract signed by an expert lawyer",
        "A program that runs automatically on the blockchain",
        "A verbal agreement between two people",
      ],
      explanation:
        "A smart contract is on-chain code that executes automatically when predefined conditions are met.",
    },
  },
  {
    category: "blockchain",
    difficulty: 2,
    correctIndex: 0,
    es: {
      text: "¿Qué es el 'gas' en una red blockchain?",
      options: [
        "La comisión que se paga por procesar una transacción",
        "Un combustible físico para los servidores",
        "Un token exclusivo de Bitcoin",
      ],
      explanation:
        "El gas compensa a la red por procesar transacciones; en Celo las tarifas son muy bajas.",
    },
    en: {
      text: "What is 'gas' on a blockchain network?",
      options: [
        "The fee paid to process a transaction",
        "Physical fuel for the servers",
        "A token exclusive to Bitcoin",
      ],
      explanation:
        "Gas compensates the network for processing transactions; on Celo fees are very low.",
    },
  },
  {
    category: "blockchain",
    difficulty: 2,
    correctIndex: 2,
    es: {
      text: "¿Por qué es difícil falsificar información en una blockchain?",
      options: [
        "Porque la policía la vigila",
        "Porque está guardada en papel",
        "Porque miles de nodos verifican y comparten el mismo registro",
      ],
      explanation:
        "Hackear miles de nodos simultáneamente es extremadamente difícil y costoso.",
    },
    en: {
      text: "Why is it hard to falsify information on a blockchain?",
      options: [
        "Because the police monitor it",
        "Because it is stored on paper",
        "Because thousands of nodes verify and share the same record",
      ],
      explanation:
        "Hacking thousands of nodes at once is extremely difficult and expensive.",
    },
  },
  {
    category: "blockchain",
    difficulty: 2,
    correctIndex: 1,
    es: {
      text: "¿Qué es la finalidad (finality) de una transacción?",
      options: [
        "El precio del token al momento del envío",
        "El momento en que la transacción es confirmada y no puede revertirse",
        "El nombre del remitente",
      ],
      explanation:
        "Una vez finalizada, la transacción es permanente e irreversible en la blockchain.",
    },
    en: {
      text: "What is transaction finality?",
      options: [
        "The token price at send time",
        "The moment a transaction is confirmed and cannot be reversed",
        "The sender's name",
      ],
      explanation:
        "Once finalized, a transaction is permanent and irreversible on the blockchain.",
    },
  },
  {
    category: "blockchain",
    difficulty: 2,
    correctIndex: 0,
    es: {
      text: "¿Qué es un explorador de bloques (block explorer)?",
      options: [
        "Una herramienta web para ver transacciones y direcciones en la blockchain",
        "Un juego de aventuras",
        "Un tipo de wallet móvil",
      ],
      explanation:
        "Exploradores como celoscan.io permiten auditar transacciones de forma transparente.",
    },
    en: {
      text: "What is a block explorer?",
      options: [
        "A web tool to view transactions and addresses on the blockchain",
        "An adventure game",
        "A type of mobile wallet",
      ],
      explanation:
        "Explorers like celoscan.io let you audit transactions transparently.",
    },
  },
  {
    category: "blockchain",
    difficulty: 2,
    correctIndex: 2,
    es: {
      text: "¿Qué es Proof of Stake (prueba de participación)?",
      options: [
        "Un examen para mineros",
        "Un sistema de votación política",
        "Un mecanismo donde validadores bloquean tokens para asegurar la red",
      ],
      explanation:
        "PoS elige validadores según su stake, consumiendo mucha menos energía que la minería tradicional.",
    },
    en: {
      text: "What is Proof of Stake?",
      options: [
        "A test for miners",
        "A political voting system",
        "A mechanism where validators lock tokens to secure the network",
      ],
      explanation:
        "PoS selects validators by stake, using far less energy than traditional mining.",
    },
  },
  {
    category: "blockchain",
    difficulty: 2,
    correctIndex: 1,
    es: {
      text: "¿Qué es un token ERC-20?",
      options: [
        "Un NFT de arte digital",
        "Un estándar común para tokens fungibles en blockchains compatibles con EVM",
        "Un protocolo de correo electrónico",
      ],
      explanation:
        "ERC-20 define reglas para tokens intercambiables como cUSD o USDC en redes EVM.",
    },
    en: {
      text: "What is an ERC-20 token?",
      options: [
        "A digital art NFT",
        "A common standard for fungible tokens on EVM-compatible blockchains",
        "An email protocol",
      ],
      explanation:
        "ERC-20 defines rules for interchangeable tokens like cUSD or USDC on EVM networks.",
    },
  },
  {
    category: "blockchain",
    difficulty: 2,
    correctIndex: 0,
    es: {
      text: "¿Qué es la EVM (Ethereum Virtual Machine)?",
      options: [
        "El entorno donde se ejecutan smart contracts en blockchains compatibles",
        "Una empresa de videojuegos móviles",
        "Un tipo de wallet hardware",
      ],
      explanation:
        "Celo es compatible con EVM, permitiendo usar Solidity y herramientas de Ethereum.",
    },
    en: {
      text: "What is the EVM (Ethereum Virtual Machine)?",
      options: [
        "The environment where smart contracts run on compatible blockchains",
        "A mobile video game company",
        "A hardware wallet type",
      ],
      explanation:
        "Celo is EVM-compatible, allowing use of Solidity and Ethereum tooling.",
    },
  },

  // ========== DIFFICULTY 2 — WALLETS (9) ==========
  {
    category: "wallets",
    difficulty: 2,
    correctIndex: 0,
    es: {
      text: "¿Cuál es la diferencia entre una wallet custodial y una no custodial?",
      options: [
        "En la no custodial, solo tú controlas las llaves privadas",
        "La custodial es siempre gratuita",
        "No hay ninguna diferencia",
      ],
      explanation:
        "En una wallet no custodial como MiniPay, tú tienes control total de tus llaves y fondos.",
    },
    en: {
      text: "What is the difference between a custodial and non-custodial wallet?",
      options: [
        "In a non-custodial wallet, only you control the private keys",
        "Custodial wallets are always free",
        "There is no difference",
      ],
      explanation:
        "In a non-custodial wallet like MiniPay, you have full control of your keys and funds.",
    },
  },
  {
    category: "wallets",
    difficulty: 2,
    correctIndex: 1,
    es: {
      text: "¿Qué es una wallet fría (cold wallet)?",
      options: [
        "Una wallet sin internet que nunca se conecta",
        "Una wallet offline o hardware para almacenamiento seguro a largo plazo",
        "Una wallet que solo acepta stablecoins",
      ],
      explanation:
        "Las cold wallets aíslan llaves de internet, ideal para ahorros grandes.",
    },
    en: {
      text: "What is a cold wallet?",
      options: [
        "A wallet that never connects to the internet",
        "An offline or hardware wallet for long-term secure storage",
        "A wallet that only accepts stablecoins",
      ],
      explanation:
        "Cold wallets isolate keys from the internet, ideal for larger savings.",
    },
  },
  {
    category: "wallets",
    difficulty: 2,
    correctIndex: 2,
    es: {
      text: "¿Qué es un hardware wallet?",
      options: [
        "Una app de juegos",
        "Un servidor en la nube",
        "Un dispositivo físico que guarda llaves privadas fuera de línea",
      ],
      explanation:
        "Firmas transacciones en el dispositivo sin exponer la llave privada a la computadora.",
    },
    en: {
      text: "What is a hardware wallet?",
      options: [
        "A gaming app",
        "A cloud server",
        "A physical device that stores private keys offline",
      ],
      explanation:
        "You sign transactions on the device without exposing the private key to your computer.",
    },
  },
  {
    category: "wallets",
    difficulty: 2,
    correctIndex: 1,
    es: {
      text: "¿Qué significa 'firmar' una transacción?",
      options: [
        "Escribir tu nombre en papel",
        "Usar tu llave privada para autorizar criptográficamente una operación",
        "Enviar un selfie de verificación",
      ],
      explanation:
        "La firma digital prueba que tú autorizaste la transacción sin revelar la llave.",
    },
    en: {
      text: "What does 'signing' a transaction mean?",
      options: [
        "Writing your name on paper",
        "Using your private key to cryptographically authorize an operation",
        "Sending a verification selfie",
      ],
      explanation:
        "The digital signature proves you authorized the transaction without revealing the key.",
    },
  },
  {
    category: "wallets",
    difficulty: 2,
    correctIndex: 0,
    es: {
      text: "¿Qué es una wallet de extensión de navegador?",
      options: [
        "Una extensión que conecta tu navegador a dApps y blockchains",
        "Un antivirus para Chrome",
        "Un bloqueador de anuncios",
      ],
      explanation:
        "Extensiones como MetaMask permiten interactuar con aplicaciones descentralizadas.",
    },
    en: {
      text: "What is a browser extension wallet?",
      options: [
        "An extension connecting your browser to dApps and blockchains",
        "A Chrome antivirus",
        "An ad blocker",
      ],
      explanation:
        "Extensions like MetaMask let you interact with decentralized applications.",
    },
  },
  {
    category: "wallets",
    difficulty: 2,
    correctIndex: 2,
    es: {
      text: "¿Qué es WalletConnect?",
      options: [
        "Un banco digital europeo",
        "Un tipo de stablecoin",
        "Un protocolo para conectar wallets móviles con dApps de forma segura",
      ],
      explanation:
        "WalletConnect usa un QR para autorizar acciones sin compartir tu llave privada.",
    },
    en: {
      text: "What is WalletConnect?",
      options: [
        "A European digital bank",
        "A type of stablecoin",
        "A protocol to securely connect mobile wallets to dApps",
      ],
      explanation:
        "WalletConnect uses a QR code to authorize actions without sharing your private key.",
    },
  },
  {
    category: "wallets",
    difficulty: 2,
    correctIndex: 1,
    es: {
      text: "¿Qué es un multisig wallet?",
      options: [
        "Una wallet con un solo firmante",
        "Una wallet que requiere varias firmas para autorizar transacciones",
        "Una wallet sin contraseña",
      ],
      explanation:
        "Multisig añade seguridad exigiendo aprobación de múltiples llaves para mover fondos.",
    },
    en: {
      text: "What is a multisig wallet?",
      options: [
        "A wallet with one signer",
        "A wallet requiring multiple signatures to authorize transactions",
        "A passwordless wallet",
      ],
      explanation:
        "Multisig adds security by requiring approval from multiple keys to move funds.",
    },
  },
  {
    category: "wallets",
    difficulty: 2,
    correctIndex: 0,
    es: {
      text: "¿Por qué debes verificar la dirección de destino antes de enviar?",
      options: [
        "Porque un error envía fondos a la dirección equivocada sin posibilidad de revertir",
        "Porque la red cobra extra por direcciones nuevas",
        "Porque las direcciones expiran en 24 horas",
      ],
      explanation:
        "Las transacciones blockchain son irreversibles; revisa los primeros y últimos caracteres.",
    },
    en: {
      text: "Why verify the destination address before sending?",
      options: [
        "Because mistakes send funds to the wrong address with no reversal",
        "Because the network charges extra for new addresses",
        "Because addresses expire in 24 hours",
      ],
      explanation:
        "Blockchain transactions are irreversible; check the first and last characters.",
    },
  },
  {
    category: "wallets",
    difficulty: 2,
    correctIndex: 2,
    es: {
      text: "¿Qué es una dApp (aplicación descentralizada)?",
      options: [
        "Una app de delivery de comida",
        "Una aplicación bancaria tradicional",
        "Una aplicación que interactúa con smart contracts sin servidor central",
      ],
      explanation:
        "Las dApps usan la blockchain como backend y no dependen de una empresa central.",
    },
    en: {
      text: "What is a dApp (decentralized application)?",
      options: [
        "A food delivery app",
        "A traditional banking app",
        "An application that interacts with smart contracts without a central server",
      ],
      explanation:
        "dApps use the blockchain as backend and don't depend on a central company.",
    },
  },

  // ========== DIFFICULTY 2 — CELO (8) ==========
  {
    category: "celo",
    difficulty: 2,
    correctIndex: 1,
    es: {
      text: "¿Qué es cUSD en la red Celo?",
      options: [
        "El token de gobernanza de Celo",
        "Una stablecoin atada al dólar estadounidense",
        "Un NFT oficial de Celo",
      ],
      explanation:
        "cUSD mantiene paridad ~1:1 con USD, ideal para pagos cotidianos en Celo.",
    },
    en: {
      text: "What is cUSD on the Celo network?",
      options: [
        "Celo's governance token",
        "A stablecoin pegged to the US dollar",
        "An official Celo NFT",
      ],
      explanation:
        "cUSD maintains ~1:1 parity with USD, ideal for everyday Celo payments.",
    },
  },
  {
    category: "celo",
    difficulty: 2,
    correctIndex: 0,
    es: {
      text: "¿Qué es Valora?",
      options: [
        "Una wallet popular del ecosistema Celo",
        "Un exchange centralizado de acciones",
        "Un protocolo de minería",
      ],
      explanation:
        "Valora facilita enviar, recibir y ahorrar con stablecoins en Celo.",
    },
    en: {
      text: "What is Valora?",
      options: [
        "A popular Celo ecosystem wallet",
        "A centralized stock exchange",
        "A mining protocol",
      ],
      explanation:
        "Valora makes it easy to send, receive, and save with Celo stablecoins.",
    },
  },
  {
    category: "celo",
    difficulty: 2,
    correctIndex: 2,
    es: {
      text: "¿Cómo mantiene Celo la estabilidad de sus stablecoins?",
      options: [
        "Imprimiendo CELO ilimitadamente",
        "Solo con confianza en el gobierno",
        "Mediante reservas, arbitraje y contratos inteligentes del protocolo Mento",
      ],
      explanation:
        "El protocolo expande o contrae oferta para mantener stablecoins cerca de su paridad.",
    },
    en: {
      text: "How does Celo maintain stablecoin stability?",
      options: [
        "By printing unlimited CELO",
        "Through government trust only",
        "Through reserves, arbitrage, and Mento protocol smart contracts",
      ],
      explanation:
        "The protocol expands or contracts supply to keep stablecoins near their peg.",
    },
  },
  {
    category: "celo",
    difficulty: 2,
    correctIndex: 1,
    es: {
      text: "¿Qué es CeloScan?",
      options: [
        "Una tienda de aplicaciones",
        "Un explorador de bloques para ver transacciones en Celo",
        "Un juego móvil educativo",
      ],
      explanation:
        "CeloScan muestra historial de transacciones, contratos y saldos de forma transparente.",
    },
    en: {
      text: "What is CeloScan?",
      options: [
        "An app store",
        "A block explorer to view Celo transactions",
        "An educational mobile game",
      ],
      explanation:
        "CeloScan shows transaction history, contracts, and balances transparently.",
    },
  },
  {
    category: "celo",
    difficulty: 2,
    correctIndex: 0,
    es: {
      text: "¿Se puede pagar gas en Celo con stablecoins?",
      options: [
        "Sí, Celo permite pagar tarifas con cUSD y otras monedas",
        "No, solo con CELO",
        "Solo con Bitcoin",
      ],
      explanation:
        "Pagar gas con stablecoins simplifica la experiencia para usuarios nuevos.",
    },
    en: {
      text: "Can you pay gas on Celo with stablecoins?",
      options: [
        "Yes, Celo allows fees with cUSD and other currencies",
        "No, CELO only",
        "Bitcoin only",
      ],
      explanation:
        "Paying gas with stablecoins simplifies the experience for new users.",
    },
  },
  {
    category: "celo",
    difficulty: 2,
    correctIndex: 2,
    es: {
      text: "¿Qué mecanismo de consenso usa Celo?",
      options: [
        "Proof of Work con minería de GPUs",
        "Proof of Authority centralizado",
        "Proof of Stake con validadores que bloquean CELO",
      ],
      explanation:
        "PoS en Celo es eficiente en energía y alinea incentivos de validadores con la red.",
    },
    en: {
      text: "What consensus mechanism does Celo use?",
      options: [
        "Proof of Work with GPU mining",
        "Centralized Proof of Authority",
        "Proof of Stake with validators staking CELO",
      ],
      explanation:
        "PoS on Celo is energy-efficient and aligns validator incentives with the network.",
    },
  },
  {
    category: "celo",
    difficulty: 2,
    correctIndex: 1,
    es: {
      text: "¿Qué lenguaje se usa para smart contracts en Celo?",
      options: [
        "Python exclusivamente",
        "Solidity, igual que en Ethereum",
        "Solo HTML y CSS",
      ],
      explanation:
        "Solidity permite reutilizar conocimiento y contratos del ecosistema Ethereum.",
    },
    en: {
      text: "Which language is used for smart contracts on Celo?",
      options: [
        "Python only",
        "Solidity, same as Ethereum",
        "HTML and CSS only",
      ],
      explanation:
        "Solidity lets developers reuse knowledge and contracts from the Ethereum ecosystem.",
    },
  },
  {
    category: "celo",
    difficulty: 2,
    correctIndex: 0,
    es: {
      text: "¿Qué es Mento en el ecosistema Celo?",
      options: [
        "El protocolo que gestiona stablecoins y tipos de cambio en Celo",
        "Una red social de Celo",
        "Un tipo de wallet hardware",
      ],
      explanation:
        "Mento administra cUSD, cEUR y otros activos estables del ecosistema.",
    },
    en: {
      text: "What is Mento in the Celo ecosystem?",
      options: [
        "The protocol managing stablecoins and exchange rates on Celo",
        "A Celo social network",
        "A hardware wallet type",
      ],
      explanation:
        "Mento manages cUSD, cEUR, and other stable assets in the ecosystem.",
    },
  },

  // ========== DIFFICULTY 2 — MINIPAY (8) ==========
  {
    category: "minipay",
    difficulty: 2,
    correctIndex: 0,
    es: {
      text: "¿Cómo se crea una wallet en MiniPay?",
      options: [
        "Automáticamente al usar la app, sin frase de 24 palabras tradicional",
        "Solo en una sucursal bancaria",
        "Mediante minería de Bitcoin",
      ],
      explanation:
        "MiniPay simplifica la creación de wallet para usuarios sin experiencia cripto previa.",
    },
    en: {
      text: "How is a wallet created in MiniPay?",
      options: [
        "Automatically when using the app, without a traditional 24-word phrase",
        "Only at a bank branch",
        "Through Bitcoin mining",
      ],
      explanation:
        "MiniPay simplifies wallet creation for users with no prior crypto experience.",
    },
  },
  {
    category: "minipay",
    difficulty: 2,
    correctIndex: 2,
    es: {
      text: "¿Qué stablecoin usa MiniPay por defecto en muchas regiones?",
      options: ["BTC", "ETH", "cUSD"],
      explanation:
        "cUSD permite transacciones en valor de dólar con comisiones mínimas en Celo.",
    },
    en: {
      text: "Which stablecoin does MiniPay default to in many regions?",
      options: ["BTC", "ETH", "cUSD"],
      explanation:
        "cUSD enables dollar-value transactions with minimal fees on Celo.",
    },
  },
  {
    category: "minipay",
    difficulty: 2,
    correctIndex: 1,
    es: {
      text: "¿MiniPay cobra comisiones altas por transacción?",
      options: [
        "Sí, similares a transferencias bancarias internacionales",
        "No, aprovecha las bajas comisiones de la red Celo",
        "Solo cobra en Bitcoin",
      ],
      explanation:
        "Las tarifas en Celo son de fracciones de centavo, ideal para micropagos.",
    },
    en: {
      text: "Does MiniPay charge high transaction fees?",
      options: [
        "Yes, similar to international bank transfers",
        "No, it leverages Celo's low network fees",
        "It only charges in Bitcoin",
      ],
      explanation:
        "Celo fees are fractions of a cent, ideal for micropayments.",
    },
  },
  {
    category: "minipay",
    difficulty: 2,
    correctIndex: 0,
    es: {
      text: "¿Qué problema resuelve MiniPay en mercados emergentes?",
      options: [
        "Acceso a pagos digitales sin cuenta bancaria tradicional",
        "Minería de criptomonedas en casa",
        "Trading de acciones en Wall Street",
      ],
      explanation:
        "MiniPay lleva stablecoins a quienes tienen celular pero no acceso bancario completo.",
    },
    en: {
      text: "What problem does MiniPay solve in emerging markets?",
      options: [
        "Access to digital payments without a traditional bank account",
        "Home cryptocurrency mining",
        "Wall Street stock trading",
      ],
      explanation:
        "MiniPay brings stablecoins to people with phones but incomplete banking access.",
    },
  },
  {
    category: "minipay",
    difficulty: 2,
    correctIndex: 2,
    es: {
      text: "¿MiniPay requiere conocimientos técnicos avanzados?",
      options: [
        "Sí, debes programar en Solidity",
        "Sí, necesitas un nodo completo de Celo",
        "No, está diseñado para usuarios cotidianos con interfaz simple",
      ],
      explanation:
        "La UX de MiniPay oculta la complejidad blockchain detrás de flujos familiares de chat.",
    },
    en: {
      text: "Does MiniPay require advanced technical knowledge?",
      options: [
        "Yes, you must program in Solidity",
        "Yes, you need a full Celo node",
        "No, it's designed for everyday users with a simple interface",
      ],
      explanation:
        "MiniPay's UX hides blockchain complexity behind familiar chat flows.",
    },
  },
  {
    category: "minipay",
    difficulty: 2,
    correctIndex: 1,
    es: {
      text: "¿Puedes recibir pagos internacionales con MiniPay?",
      options: [
        "No, solo funciona en un edificio",
        "Sí, las stablecoins en Celo permiten transferencias globales rápidas y baratas",
        "Solo con cheques físicos",
      ],
      explanation:
        "Las stablecoins on-chain eliminan intermediarios costosos en remesas internacionales.",
    },
    en: {
      text: "Can you receive international payments with MiniPay?",
      options: [
        "No, it only works in one building",
        "Yes, Celo stablecoins enable fast, cheap global transfers",
        "Only with physical checks",
      ],
      explanation:
        "On-chain stablecoins remove costly intermediaries from international remittances.",
    },
  },
  {
    category: "minipay",
    difficulty: 2,
    correctIndex: 0,
    es: {
      text: "¿Qué información necesitas para enviar dinero con MiniPay?",
      options: [
        "El contacto de WhatsApp o número del destinatario, no una dirección hexadecimal larga",
        "Tu seed phrase completa",
        "El código fuente de un smart contract",
      ],
      explanation:
        "MiniPay abstrae direcciones blockchain usando identificadores familiares como números de teléfono.",
    },
    en: {
      text: "What info do you need to send money with MiniPay?",
      options: [
        "The recipient's WhatsApp contact or number, not a long hex address",
        "Your full seed phrase",
        "A smart contract source code",
      ],
      explanation:
        "MiniPay abstracts blockchain addresses using familiar identifiers like phone numbers.",
    },
  },
  {
    category: "minipay",
    difficulty: 2,
    correctIndex: 2,
    es: {
      text: "¿MiniPay es adecuado para comerciantes pequeños?",
      options: [
        "No, solo para corporaciones",
        "No, no acepta pagos entrantes",
        "Sí, permite recibir pagos en stablecoins con bajo costo y sin POS tradicional",
      ],
      explanation:
        "Comerciantes pueden aceptar pagos digitales sin terminal bancario costoso.",
    },
    en: {
      text: "Is MiniPay suitable for small merchants?",
      options: [
        "No, corporations only",
        "No, it doesn't accept incoming payments",
        "Yes, it accepts stablecoin payments at low cost without traditional POS",
      ],
      explanation:
        "Merchants can accept digital payments without expensive bank terminals.",
    },
  },

  // ========== DIFFICULTY 2 — STABLECOINS (8) ==========
  {
    category: "stablecoins",
    difficulty: 2,
    correctIndex: 1,
    es: {
      text: "¿Cuál es la diferencia entre stablecoins fiat-backed y algorithmic?",
      options: [
        "No hay diferencia",
        "Las fiat-backed tienen reservas de moneda tradicional; las algorithmic usan reglas on-chain",
        "Las algorithmic siempre valen 1000 dólares",
      ],
      explanation:
        "cUSD usa mecanismos del protocolo Mento con reservas y arbitraje, no solo algoritmos puros.",
    },
    en: {
      text: "What is the difference between fiat-backed and algorithmic stablecoins?",
      options: [
        "No difference",
        "Fiat-backed hold traditional currency reserves; algorithmic use on-chain rules",
        "Algorithmic always worth $1000",
      ],
      explanation:
        "cUSD uses Mento protocol mechanisms with reserves and arbitrage, not pure algorithms alone.",
    },
  },
  {
    category: "stablecoins",
    difficulty: 2,
    correctIndex: 0,
    es: {
      text: "¿Qué es un 'depeg' de una stablecoin?",
      options: [
        "Cuando la stablecoin pierde paridad con su activo de referencia",
        "Cuando sube el precio del gas",
        "Cuando se crea un NFT",
      ],
      explanation:
        "Un depeg ocurre cuando 1 stablecoin ya no equivale a ~1 unidad de la moneda ancla.",
    },
    en: {
      text: "What is a stablecoin 'depeg'?",
      options: [
        "When the stablecoin loses parity with its reference asset",
        "When gas price rises",
        "When an NFT is minted",
      ],
      explanation:
        "A depeg occurs when 1 stablecoin no longer equals ~1 unit of the anchor currency.",
    },
  },
  {
    category: "stablecoins",
    difficulty: 2,
    correctIndex: 2,
    es: {
      text: "¿Por qué Celo integra stablecoins nativas como cUSD?",
      options: [
        "Para eliminar smart contracts",
        "Para aumentar volatilidad",
        "Para que usuarios paguen y ahorren en moneda estable sin salir de la red",
      ],
      explanation:
        "Stablecoins nativas simplifican pagos móviles y DeFi sin depender de puentes externos.",
    },
    en: {
      text: "Why does Celo integrate native stablecoins like cUSD?",
      options: [
        "To eliminate smart contracts",
        "To increase volatility",
        "So users pay and save in stable currency without leaving the network",
      ],
      explanation:
        "Native stablecoins simplify mobile payments and DeFi without relying on external bridges.",
    },
  },
  {
    category: "stablecoins",
    difficulty: 2,
    correctIndex: 1,
    es: {
      text: "¿Qué es USDT?",
      options: [
        "Un token de gobernanza de Celo",
        "Una stablecoin ampliamente usada atada al dólar, también disponible en Celo",
        "Un protocolo de consenso",
      ],
      explanation:
        "USDT es una de las stablecoins más líquidas del mercado cripto global.",
    },
    en: {
      text: "What is USDT?",
      options: [
        "A Celo governance token",
        "A widely used dollar-pegged stablecoin also on Celo",
        "A consensus protocol",
      ],
      explanation:
        "USDT is one of the most liquid stablecoins in the global crypto market.",
    },
  },
  {
    category: "stablecoins",
    difficulty: 2,
    correctIndex: 0,
    es: {
      text: "¿Qué ventaja tienen las stablecoins para remesas?",
      options: [
        "Transferencias internacionales más rápidas y baratas que sistemas tradicionales",
        "Solo funcionan dentro de un banco",
        "Requieren visa de trabajo",
      ],
      explanation:
        "Enviar cUSD on-chain puede costar centavos vs. comisiones altas de remesas tradicionales.",
    },
    en: {
      text: "What advantage do stablecoins offer for remittances?",
      options: [
        "Faster, cheaper international transfers than traditional systems",
        "They only work inside one bank",
        "They require a work visa",
      ],
      explanation:
        "Sending cUSD on-chain can cost cents vs. high traditional remittance fees.",
    },
  },
  {
    category: "stablecoins",
    difficulty: 2,
    correctIndex: 2,
    es: {
      text: "¿Qué es colateral en el contexto de stablecoins?",
      options: [
        "Un tipo de NFT",
        "Una comisión de red",
        "Activos depositados como respaldo para mantener el valor de la stablecoin",
      ],
      explanation:
        "El colateral respalda la confianza en que la stablecoin puede redimirse por su valor ancla.",
    },
    en: {
      text: "What is collateral in the context of stablecoins?",
      options: [
        "A type of NFT",
        "A network fee",
        "Assets deposited as backing to maintain the stablecoin's value",
      ],
      explanation:
        "Collateral backs confidence that the stablecoin can be redeemed for its anchor value.",
    },
  },
  {
    category: "stablecoins",
    difficulty: 2,
    correctIndex: 1,
    es: {
      text: "¿Puedes usar stablecoins en DeFi en Celo?",
      options: [
        "No, las stablecoins solo sirven para pagar café",
        "Sí, en protocolos de préstamos, ahorro y liquidez",
        "Solo en bancos tradicionales",
      ],
      explanation:
        "Stablecoins son la base de muchos protocolos DeFi por su predictibilidad de precio.",
    },
    en: {
      text: "Can you use stablecoins in DeFi on Celo?",
      options: [
        "No, stablecoins are only for buying coffee",
        "Yes, in lending, savings, and liquidity protocols",
        "Only in traditional banks",
      ],
      explanation:
        "Stablecoins underpin many DeFi protocols due to their price predictability.",
    },
  },
  {
    category: "stablecoins",
    difficulty: 2,
    correctIndex: 0,
    es: {
      text: "¿Qué es cREAL en Celo?",
      options: [
        "Una stablecoin atada al real brasileño",
        "Un token de minería",
        "Un NFT de arte brasileño",
      ],
      explanation:
        "cREAL permite pagos y ahorro en reales digitales dentro del ecosistema Celo.",
    },
    en: {
      text: "What is cREAL on Celo?",
      options: [
        "A stablecoin pegged to the Brazilian real",
        "A mining token",
        "A Brazilian art NFT",
      ],
      explanation:
        "cREAL enables payments and savings in digital reals within the Celo ecosystem.",
    },
  },

  // ========== DIFFICULTY 2 — SECURITY (9) ==========
  {
    category: "security",
    difficulty: 2,
    correctIndex: 1,
    es: {
      text: "¿Qué es un ataque de phishing con wallet falsa?",
      options: [
        "Un tipo de consenso PoS",
        "Un sitio o app que imita una wallet legítima para robar credenciales",
        "Una comisión de gas legítima",
      ],
      explanation:
        "Verifica siempre el dominio oficial y nunca ingreses tu seed phrase en formularios web.",
    },
    en: {
      text: "What is a fake wallet phishing attack?",
      options: [
        "A type of PoS consensus",
        "A site or app mimicking a legitimate wallet to steal credentials",
        "A legitimate gas fee",
      ],
      explanation:
        "Always verify the official domain and never enter your seed phrase in web forms.",
    },
  },
  {
    category: "security",
    difficulty: 2,
    correctIndex: 0,
    es: {
      text: "¿Qué es un token allowance (permiso de gasto)?",
      options: [
        "Autorización que das a un contrato para gastar cierta cantidad de tus tokens",
        "Un descuento en comisiones de gas",
        "Un tipo de stablecoin",
      ],
      explanation:
        "Revisa y revoca allowances no usados para reducir riesgo si un contrato es comprometido.",
    },
    en: {
      text: "What is a token allowance (spending permission)?",
      options: [
        "Authorization for a contract to spend a set amount of your tokens",
        "A gas fee discount",
        "A type of stablecoin",
      ],
      explanation:
        "Review and revoke unused allowances to reduce risk if a contract is compromised.",
    },
  },
  {
    category: "security",
    difficulty: 2,
    correctIndex: 2,
    es: {
      text: "¿Qué es un rug pull?",
      options: [
        "Un protocolo de consenso seguro",
        "Una actualización de wallet",
        "Cuando desarrolladores abandonan un proyecto y se llevan los fondos de los usuarios",
      ],
      explanation:
        "Investiga equipos, auditorías y liquidez antes de depositar fondos en proyectos nuevos.",
    },
    en: {
      text: "What is a rug pull?",
      options: [
        "A secure consensus protocol",
        "A wallet update",
        "When developers abandon a project and take users' funds",
      ],
      explanation:
        "Research teams, audits, and liquidity before depositing funds in new projects.",
    },
  },
  {
    category: "security",
    difficulty: 2,
    correctIndex: 1,
    es: {
      text: "¿Qué es simular una transacción antes de firmarla?",
      options: [
        "Jugar un videojuego",
        "Previsualizar cambios de saldo y riesgos antes de confirmar on-chain",
        "Enviar fondos a una dirección aleatoria",
      ],
      explanation:
        "Wallets avanzadas muestran qué aprobarás exactamente antes de firmar.",
    },
    en: {
      text: "What is simulating a transaction before signing?",
      options: [
        "Playing a video game",
        "Previewing balance changes and risks before on-chain confirmation",
        "Sending funds to a random address",
      ],
      explanation:
        "Advanced wallets show exactly what you'll approve before you sign.",
    },
  },
  {
    category: "security",
    difficulty: 2,
    correctIndex: 0,
    es: {
      text: "¿Por qué no debes hacer screenshot de tu seed phrase?",
      options: [
        "Porque las fotos pueden sincronizarse a la nube y ser hackeadas",
        "Porque la seed phrase expira en 5 minutos",
        "Porque los screenshots invalidan la wallet",
      ],
      explanation:
        "Las copias digitales de tu seed phrase son vulnerables a malware y filtraciones de nube.",
    },
    en: {
      text: "Why shouldn't you screenshot your seed phrase?",
      options: [
        "Because photos may sync to the cloud and get hacked",
        "Because the seed phrase expires in 5 minutes",
        "Because screenshots invalidate the wallet",
      ],
      explanation:
        "Digital copies of your seed phrase are vulnerable to malware and cloud leaks.",
    },
  },
  {
    category: "security",
    difficulty: 2,
    correctIndex: 2,
    es: {
      text: "¿Qué es un contrato malicioso en una dApp?",
      options: [
        "Un contrato que siempre devuelve fondos",
        "Un contrato auditado por OpenZeppelin",
        "Un smart contract diseñado para drenar tokens si lo apruebas",
      ],
      explanation:
        "Lee permisos solicitados y usa solo dApps con reputación y auditorías verificables.",
    },
    en: {
      text: "What is a malicious contract in a dApp?",
      options: [
        "A contract that always returns funds",
        "A contract audited by OpenZeppelin",
        "A smart contract designed to drain tokens if you approve it",
      ],
      explanation:
        "Read requested permissions and use only dApps with reputation and verifiable audits.",
    },
  },
  {
    category: "security",
    difficulty: 2,
    correctIndex: 1,
    es: {
      text: "¿Qué es verificación de contrato en un explorador?",
      options: [
        "Comprobar el color del logo",
        "Confirmar que el código fuente publicado coincide con el bytecode on-chain",
        "Verificar tu email",
      ],
      explanation:
        "Contratos verificados en CeloScan permiten auditar qué hace el código antes de interactuar.",
    },
    en: {
      text: "What is contract verification on an explorer?",
      options: [
        "Checking the logo color",
        "Confirming published source code matches on-chain bytecode",
        "Verifying your email",
      ],
      explanation:
        "Verified contracts on CeloScan let you audit what the code does before interacting.",
    },
  },
  {
    category: "security",
    difficulty: 2,
    correctIndex: 0,
    es: {
      text: "¿Qué es un ataque de homógrafos en direcciones?",
      options: [
        "Usar caracteres visualmente similares para engañar al copiar direcciones",
        "Robar WiFi del vecino",
        "Hackear el consenso de Celo",
      ],
      explanation:
        "Siempre pega direcciones desde fuentes confiables y verifica carácter por carácter.",
    },
    en: {
      text: "What is a homograph attack on addresses?",
      options: [
        "Using visually similar characters to trick address copying",
        "Stealing neighbor's WiFi",
        "Hacking Celo consensus",
      ],
      explanation:
        "Always paste addresses from trusted sources and verify character by character.",
    },
  },
  {
    category: "security",
    difficulty: 2,
    correctIndex: 2,
    es: {
      text: "¿Qué práctica mejora la seguridad en exchanges centralizados?",
      options: [
        "Reutilizar contraseñas débiles",
        "Desactivar todas las alertas",
        "Activar 2FA y retirar fondos largos a wallet propia no custodial",
      ],
      explanation:
        "No dejes grandes cantidades en exchanges; 'not your keys, not your crypto' aplica aquí también.",
    },
    en: {
      text: "What practice improves security on centralized exchanges?",
      options: [
        "Reusing weak passwords",
        "Disabling all alerts",
        "Enabling 2FA and withdrawing long-term funds to your own non-custodial wallet",
      ],
      explanation:
        "Don't leave large amounts on exchanges; 'not your keys, not your crypto' applies here too.",
    },
  },

  // ========== DIFFICULTY 3 — BLOCKCHAIN (8) ==========
  {
    category: "blockchain",
    difficulty: 3,
    correctIndex: 1,
    es: {
      text: "¿Qué es el consenso en una blockchain?",
      options: [
        "Un acuerdo verbal entre amigos",
        "El mecanismo por el cual los nodos acuerdan el estado válido del libro mayor",
        "Un tipo de token de recompensa",
      ],
      explanation:
        "Sin consenso, cada nodo tendría una versión distinta de la blockchain y la red colapsaría.",
    },
    en: {
      text: "What is consensus in a blockchain?",
      options: [
        "A verbal agreement among friends",
        "The mechanism nodes use to agree on the valid ledger state",
        "A type of reward token",
      ],
      explanation:
        "Without consensus, each node would have a different ledger and the network would collapse.",
    },
  },
  {
    category: "blockchain",
    difficulty: 3,
    correctIndex: 2,
    es: {
      text: "¿Qué es un rollup de capa 2?",
      options: [
        "Un tipo de wallet móvil",
        "Una moneda física",
        "Una solución que agrupa transacciones off-chain y las ancla en la capa 1",
      ],
      explanation:
        "Los rollups escalan blockchains procesando lotes off-chain mientras heredan seguridad de la base.",
    },
    en: {
      text: "What is a layer-2 rollup?",
      options: [
        "A mobile wallet type",
        "A physical coin",
        "A solution batching transactions off-chain and anchoring them to layer 1",
      ],
      explanation:
        "Rollups scale blockchains by processing batches off-chain while inheriting base-layer security.",
    },
  },
  {
    category: "blockchain",
    difficulty: 3,
    correctIndex: 0,
    es: {
      text: "¿Qué es la trilema blockchain?",
      options: [
        "El desafío de equilibrar escalabilidad, seguridad y descentralización",
        "Un juego de tres jugadores",
        "Un algoritmo exclusivo de Bitcoin",
      ],
      explanation:
        "Las redes buscan optimizar las tres propiedades sin sacrificar excesivamente ninguna.",
    },
    en: {
      text: "What is the blockchain trilemma?",
      options: [
        "The challenge of balancing scalability, security, and decentralization",
        "A three-player game",
        "A Bitcoin-only algorithm",
      ],
      explanation:
        "Networks seek to optimize all three properties without excessively sacrificing any.",
    },
  },
  {
    category: "blockchain",
    difficulty: 3,
    correctIndex: 1,
    es: {
      text: "¿Qué es un puente (bridge) cross-chain?",
      options: [
        "Un cable de red Ethernet",
        "Un protocolo que permite mover activos entre blockchains distintas",
        "Un explorador de bloques",
      ],
      explanation:
        "Los bridges conectan ecosistemas pero deben elegirse con auditorías y reputación verificada.",
    },
    en: {
      text: "What is a cross-chain bridge?",
      options: [
        "An Ethernet cable",
        "A protocol enabling asset movement between different blockchains",
        "A block explorer",
      ],
      explanation:
        "Bridges connect ecosystems but should be chosen with verified audits and reputation.",
    },
  },
  {
    category: "blockchain",
    difficulty: 3,
    correctIndex: 2,
    es: {
      text: "¿Qué es la abstracción de cuentas (account abstraction)?",
      options: [
        "Ocultar tu nombre en redes sociales",
        "Borrar historial de transacciones",
        "Wallets con lógica programable como recuperación social o pagos automáticos",
      ],
      explanation:
        "La abstracción de cuentas mejora UX permitiendo funciones avanzadas sin seed phrases tradicionales.",
    },
    en: {
      text: "What is account abstraction?",
      options: [
        "Hiding your name on social media",
        "Deleting transaction history",
        "Wallets with programmable logic like social recovery or auto-pay",
      ],
      explanation:
        "Account abstraction improves UX with advanced features beyond traditional seed phrases.",
    },
  },
  {
    category: "blockchain",
    difficulty: 3,
    correctIndex: 0,
    es: {
      text: "¿Qué es un oráculo blockchain?",
      options: [
        "Un servicio que trae datos del mundo real a smart contracts",
        "Una predicción mística del precio",
        "Un nodo de minería GPU",
      ],
      explanation:
        "Los oráculos permiten que contratos reaccionen a precios, eventos deportivos u otros datos externos.",
    },
    en: {
      text: "What is a blockchain oracle?",
      options: [
        "A service bringing real-world data to smart contracts",
        "A mystical price prediction",
        "A GPU mining node",
      ],
      explanation:
        "Oracles let contracts react to prices, sports outcomes, or other external data.",
    },
  },
  {
    category: "blockchain",
    difficulty: 3,
    correctIndex: 1,
    es: {
      text: "¿Qué es MEV (Maximal Extractable Value)?",
      options: [
        "El valor máximo de un NFT",
        "Beneficio que validadores pueden obtener reordenando transacciones en un bloque",
        "El market cap de Ethereum",
      ],
      explanation:
        "MEV afecta a usuarios cuando productores de bloques priorizan transacciones por ganancia propia.",
    },
    en: {
      text: "What is MEV (Maximal Extractable Value)?",
      options: [
        "The maximum value of an NFT",
        "Profit validators can extract by reordering transactions in a block",
        "Ethereum's market cap",
      ],
      explanation:
        "MEV affects users when block producers prioritize transactions for their own profit.",
    },
  },
  {
    category: "blockchain",
    difficulty: 3,
    correctIndex: 2,
    es: {
      text: "¿Qué es la interoperabilidad blockchain?",
      options: [
        "Usar una sola cadena para todo",
        "Instalar muchas wallets en el celular",
        "La capacidad de distintas blockchains de comunicarse e intercambiar valor",
      ],
      explanation:
        "La interoperabilidad evita que usuarios y liquidez queden atrapados en silos de una sola red.",
    },
    en: {
      text: "What is blockchain interoperability?",
      options: [
        "Using one chain for everything",
        "Installing many wallets on your phone",
        "The ability of different blockchains to communicate and exchange value",
      ],
      explanation:
        "Interoperability prevents users and liquidity from being trapped in single-network silos.",
    },
  },

  // ========== DIFFICULTY 3 — WALLETS (8) ==========
  {
    category: "wallets",
    difficulty: 3,
    correctIndex: 1,
    es: {
      text: "¿Qué es la recuperación social de wallet?",
      options: [
        "Pedir contraseña a un amigo al azar",
        "Contactos de confianza ayudan a recuperar acceso sin seed phrase tradicional",
        "Recuperar fondos robados automáticamente por la red",
      ],
      explanation:
        "La recuperación social mejora UX móvil permitiendo restablecer acceso con guardianes designados.",
    },
    en: {
      text: "What is social wallet recovery?",
      options: [
        "Asking a random friend for a password",
        "Trusted contacts help recover access without a traditional seed phrase",
        "Automatically recovering stolen funds from the network",
      ],
      explanation:
        "Social recovery improves mobile UX by restoring access through designated guardians.",
    },
  },
  {
    category: "wallets",
    difficulty: 3,
    correctIndex: 0,
    es: {
      text: "¿Qué es una smart contract wallet?",
      options: [
        "Una wallet cuya lógica vive en un contrato inteligente on-chain",
        "Una wallet de papel escrita a mano",
        "Una wallet que solo guarda NFTs",
      ],
      explanation:
        "Permite límites de gasto, múltiples firmantes y recuperación programable.",
    },
    en: {
      text: "What is a smart contract wallet?",
      options: [
        "A wallet whose logic lives in an on-chain smart contract",
        "A handwritten paper wallet",
        "A wallet that only stores NFTs",
      ],
      explanation:
        "It enables spending limits, multiple signers, and programmable recovery.",
    },
  },
  {
    category: "wallets",
    difficulty: 3,
    correctIndex: 2,
    es: {
      text: "¿Qué es la autocustodia (self-custody)?",
      options: [
        "Depositar todo en un exchange centralizado",
        "Delegar fondos a un banco tradicional",
        "Guardar y controlar tú mismo tus llaves y activos digitales",
      ],
      explanation:
        "La autocustodia empodera al usuario pero exige responsabilidad en seguridad y backups.",
    },
    en: {
      text: "What is self-custody?",
      options: [
        "Depositing everything on a centralized exchange",
        "Delegating funds to a traditional bank",
        "Storing and controlling your keys and digital assets yourself",
      ],
      explanation:
        "Self-custody empowers users but requires responsibility for security and backups.",
    },
  },
  {
    category: "wallets",
    difficulty: 3,
    correctIndex: 1,
    es: {
      text: "¿Qué es derivación HD (Hierarchical Deterministic) en wallets?",
      options: [
        "Conectar wallet por Bluetooth",
        "Generar múltiples direcciones desde una sola seed phrase de forma determinística",
        "Duplicar tokens automáticamente",
      ],
      explanation:
        "HD wallets crean muchas cuentas a partir de una frase maestra sin generar seeds separadas.",
    },
    en: {
      text: "What is HD (Hierarchical Deterministic) wallet derivation?",
      options: [
        "Connecting wallet via Bluetooth",
        "Generating multiple addresses from one seed phrase deterministically",
        "Duplicating tokens automatically",
      ],
      explanation:
        "HD wallets create many accounts from one master phrase without separate seeds.",
    },
  },
  {
    category: "wallets",
    difficulty: 3,
    correctIndex: 0,
    es: {
      text: "¿Qué es una session key en wallets avanzadas?",
      options: [
        "Una llave temporal con permisos limitados para interactuar con dApps sin firmar cada acción",
        "La seed phrase principal",
        "Una llave física de tu casa",
      ],
      explanation:
        "Las session keys mejoran UX en gaming y DeFi sin exponer la llave maestra en cada clic.",
    },
    en: {
      text: "What is a session key in advanced wallets?",
      options: [
        "A temporary key with limited permissions for dApp interaction without signing every action",
        "The main seed phrase",
        "A physical house key",
      ],
      explanation:
        "Session keys improve UX in gaming and DeFi without exposing the master key on every click.",
    },
  },
  {
    category: "wallets",
    difficulty: 3,
    correctIndex: 2,
    es: {
      text: "¿Qué es paymaster en account abstraction?",
      options: [
        "Un tipo de stablecoin",
        "Un validador de Celo",
        "Un servicio que puede patrocinar gas para usuarios en nombre de una dApp",
      ],
      explanation:
        "Paymasters permiten experiencias gasless donde la dApp o un patrocinador paga las tarifas.",
    },
    en: {
      text: "What is a paymaster in account abstraction?",
      options: [
        "A type of stablecoin",
        "A Celo validator",
        "A service that can sponsor gas for users on behalf of a dApp",
      ],
      explanation:
        "Paymasters enable gasless experiences where the dApp or sponsor pays the fees.",
    },
  },
  {
    category: "wallets",
    difficulty: 3,
    correctIndex: 1,
    es: {
      text: "¿Qué es una wallet MPC (Multi-Party Computation)?",
      options: [
        "Una wallet de un solo usuario sin seguridad",
        "Una wallet donde la llave privada se divide en partes entre varias partes sin reconstruirse nunca completa",
        "Una wallet que solo funciona offline",
      ],
      explanation:
        "MPC elimina el punto único de fallo de una seed phrase al distribuir secretos criptográficamente.",
    },
    en: {
      text: "What is an MPC (Multi-Party Computation) wallet?",
      options: [
        "A single-user wallet with no security",
        "A wallet where the private key is split among parties and never fully reconstructed",
        "A wallet that only works offline",
      ],
      explanation:
        "MPC removes the single point of failure of a seed phrase by distributing secrets cryptographically.",
    },
  },
  {
    category: "wallets",
    difficulty: 3,
    correctIndex: 0,
    es: {
      text: "¿Qué ventaja tiene integrar wallet en apps de mensajería como MiniPay?",
      options: [
        "Reduce fricción al usar identidades sociales existentes en lugar de direcciones hex",
        "Elimina la necesidad de blockchain",
        "Impide recibir pagos",
      ],
      explanation:
        "Integrar pagos en chat convierte Web3 en algo tan natural como enviar un mensaje.",
    },
    en: {
      text: "What advantage does wallet integration in messaging apps like MiniPay offer?",
      options: [
        "Reduces friction by using existing social identities instead of hex addresses",
        "Eliminates the need for blockchain",
        "Prevents receiving payments",
      ],
      explanation:
        "Embedding payments in chat makes Web3 as natural as sending a message.",
    },
  },

  // ========== DIFFICULTY 3 — CELO (9) ==========
  {
    category: "celo",
    difficulty: 3,
    correctIndex: 2,
    es: {
      text: "¿Qué es Celo Composer para desarrolladores?",
      options: [
        "Una app de música",
        "Un validador de nodos",
        "Herramientas y plantillas para construir dApps mobile-first en Celo",
      ],
      explanation:
        "Composer acelera desarrollo con SDKs, contratos de ejemplo y flujos de despliegue integrados.",
    },
    en: {
      text: "What is Celo Composer for developers?",
      options: [
        "A music app",
        "A node validator",
        "Tooling and templates to build mobile-first dApps on Celo",
      ],
      explanation:
        "Composer speeds development with SDKs, sample contracts, and integrated deployment flows.",
    },
  },
  {
    category: "celo",
    difficulty: 3,
    correctIndex: 0,
    es: {
      text: "¿Qué es el mapeo de identidad por número telefónico en Celo?",
      options: [
        "Asociar una wallet verificada a un número de teléfono para pagos P2P simples",
        "Spam de SMS masivo",
        "Borrar historial telefónico",
      ],
      explanation:
        "Los pagos por número reducen fricción para usuarios sin experiencia cripto previa.",
    },
    en: {
      text: "What is phone number identity mapping on Celo?",
      options: [
        "Linking a verified wallet to a phone number for simple P2P payments",
        "Mass SMS spam",
        "Deleting phone history",
      ],
      explanation:
        "Pay-by-number reduces friction for users with no prior crypto experience.",
    },
  },
  {
    category: "celo",
    difficulty: 3,
    correctIndex: 1,
    es: {
      text: "¿Qué es ReFi (Regenerative Finance) en el ecosistema Celo?",
      options: [
        "Finanzas que solo buscan ganancias a corto plazo",
        "Finanzas que conectan blockchain con impacto ambiental y social positivo",
        "Reembolso automático de tarifas bancarias",
      ],
      explanation:
        "Celo impulsa proyectos ReFi que tokenizan créditos de carbono y finanzas comunitarias.",
    },
    en: {
      text: "What is ReFi in the Celo ecosystem?",
      options: [
        "Finance seeking only short-term profit",
        "Finance connecting blockchain with positive environmental and social impact",
        "Automatic bank fee refunds",
      ],
      explanation:
        "Celo supports ReFi projects tokenizing carbon credits and community finance.",
    },
  },
  {
    category: "celo",
    difficulty: 3,
    correctIndex: 2,
    es: {
      text: "¿Qué es un ultralight client en Celo?",
      options: [
        "Un cliente de email ligero",
        "Un antivirus móvil",
        "Un cliente que verifica encabezados de bloques sin descargar toda la blockchain",
      ],
      explanation:
        "Permite wallets móviles eficientes en datos y batería, clave para mercados emergentes.",
    },
    en: {
      text: "What is an ultralight client on Celo?",
      options: [
        "A lightweight email client",
        "A mobile antivirus",
        "A client verifying block headers without downloading the full blockchain",
      ],
      explanation:
        "It enables data- and battery-efficient mobile wallets, key for emerging markets.",
    },
  },
  {
    category: "celo",
    difficulty: 3,
    correctIndex: 0,
    es: {
      text: "¿Qué es la gobernanza on-chain de Celo?",
      options: [
        "Sistema donde holders de CELO votan propuestas de mejora del protocolo",
        "Un chat grupal de Discord",
        "Un exchange obligatorio",
      ],
      explanation:
        "La gobernanza permite evolucionar parámetros del protocolo de forma comunitaria y transparente.",
    },
    en: {
      text: "What is Celo on-chain governance?",
      options: [
        "A system where CELO holders vote on protocol improvement proposals",
        "A Discord group chat",
        "A mandatory exchange",
      ],
      explanation:
        "Governance lets the community evolve protocol parameters transparently.",
    },
  },
  {
    category: "celo",
    difficulty: 3,
    correctIndex: 1,
    es: {
      text: "¿Qué ventaja tiene desplegar dApps en Celo vs Ethereum L1?",
      options: [
        "Imposibilidad de usar smart contracts",
        "Comisiones más bajas, stablecoins nativas y enfoque móvil para pagos reales",
        "Solo permite minería PoW",
      ],
      explanation:
        "Celo combina costos bajos, activos estables integrados y UX móvil para casos de uso reales.",
    },
    en: {
      text: "What advantage does deploying dApps on Celo vs Ethereum L1 offer?",
      options: [
        "No smart contracts allowed",
        "Lower fees, native stablecoins, and mobile focus for real payments",
        "Proof of Work mining only",
      ],
      explanation:
        "Celo combines low costs, integrated stable assets, and mobile UX for real-world use cases.",
    },
  },
  {
    category: "celo",
    difficulty: 3,
    correctIndex: 2,
    es: {
      text: "¿Qué es Celo Camp?",
      options: [
        "Un campamento de verano físico",
        "Una stablecoin experimental",
        "Programa de aceleración para startups del ecosistema Celo",
      ],
      explanation:
        "Celo Camp apoya proyectos construyendo finanzas inclusivas y regenerativas.",
    },
    en: {
      text: "What is Celo Camp?",
      options: [
        "A physical summer camp",
        "An experimental stablecoin",
        "An acceleration program for Celo ecosystem startups",
      ],
      explanation:
        "Celo Camp supports projects building inclusive and regenerative finance.",
    },
  },
  {
    category: "celo",
    difficulty: 3,
    correctIndex: 0,
    es: {
      text: "¿Qué es Optics en el contexto histórico de Celo?",
      options: [
        "Un protocolo de comunicación ligera entre Celo y otras cadenas EVM",
        "Una lente de cámara",
        "Un algoritmo de minería ASIC",
      ],
      explanation:
        "Optics exploró puentes eficientes; el ecosistema sigue innovando en interoperabilidad cross-chain.",
    },
    en: {
      text: "What was Optics in Celo's context?",
      options: [
        "A lightweight communication protocol between Celo and other EVM chains",
        "A camera lens",
        "An ASIC mining algorithm",
      ],
      explanation:
        "Optics explored efficient bridges; the ecosystem keeps innovating on cross-chain interoperability.",
    },
  },
  {
    category: "celo",
    difficulty: 3,
    correctIndex: 1,
    es: {
      text: "¿Cómo contribuye Celo al objetivo de 'prosperity for all'?",
      options: [
        "Excluyendo usuarios sin banco",
        "Habilitando pagos, ahorro y crédito accesibles vía mobile con stablecoins de bajo costo",
        "Solo permitiendo transacciones mayores a 1 millón de dólares",
      ],
      explanation:
        "Celo diseña infraestructura financiera para los billones de personas con celular pero sin banca completa.",
    },
    en: {
      text: "How does Celo contribute to 'prosperity for all'?",
      options: [
        "By excluding unbanked users",
        "By enabling accessible payments, savings, and credit via mobile with low-cost stablecoins",
        "By only allowing transactions over $1 million",
      ],
      explanation:
        "Celo builds financial infrastructure for billions with phones but incomplete banking.",
    },
  },

  // ========== DIFFICULTY 3 — MINIPAY (9) ==========
  {
    category: "minipay",
    difficulty: 3,
    correctIndex: 1,
    es: {
      text: "¿Cómo encaja MiniPay en la estrategia mobile-first de Celo?",
      options: [
        "Reemplazando completamente la blockchain",
        "Llevando stablecoins y pagos P2P al flujo de apps de mensajería que ya usan millones",
        "Eliminando la necesidad de internet",
      ],
      explanation:
        "MiniPay es el puente entre usuarios cotidianos y la infraestructura financiera de Celo.",
    },
    en: {
      text: "How does MiniPay fit Celo's mobile-first strategy?",
      options: [
        "By completely replacing the blockchain",
        "By bringing stablecoins and P2P payments into messaging apps millions already use",
        "By eliminating the need for internet",
      ],
      explanation:
        "MiniPay is the bridge between everyday users and Celo's financial infrastructure.",
    },
  },
  {
    category: "minipay",
    difficulty: 3,
    correctIndex: 0,
    es: {
      text: "¿Qué caso de uso real destacan los pagos con MiniPay en África?",
      options: [
        "Remesas, pagos a comerciantes y ahorro en stablecoins sin cuenta bancaria",
        "Minería industrial de Bitcoin",
        "Trading de derivados en Wall Street",
      ],
      explanation:
        "MiniPay democratiza acceso a dólares digitales en economías con alta inflación o acceso bancario limitado.",
    },
    en: {
      text: "What real use case do MiniPay payments highlight in Africa?",
      options: [
        "Remittances, merchant payments, and stablecoin savings without a bank account",
        "Industrial Bitcoin mining",
        "Wall Street derivatives trading",
      ],
      explanation:
        "MiniPay democratizes access to digital dollars in economies with high inflation or limited banking.",
    },
  },
  {
    category: "minipay",
    difficulty: 3,
    correctIndex: 2,
    es: {
      text: "¿Por qué MiniPay usa stablecoins en lugar de CELO volátil para pagos?",
      options: [
        "Porque CELO no existe en Celo",
        "Porque las stablecoins son más difíciles de transferir",
        "Porque los usuarios necesitan valor predecible para compras y ahorro cotidiano",
      ],
      explanation:
        "Un comerciante no puede fijar precios si el medio de pago fluctúa 10% en un día.",
    },
    en: {
      text: "Why does MiniPay use stablecoins instead of volatile CELO for payments?",
      options: [
        "Because CELO doesn't exist on Celo",
        "Because stablecoins are harder to transfer",
        "Because users need predictable value for everyday purchases and savings",
      ],
      explanation:
        "A merchant can't set prices if the payment medium swings 10% in a day.",
    },
  },
  {
    category: "minipay",
    difficulty: 3,
    correctIndex: 1,
    es: {
      text: "¿Cómo reduce MiniPay la barrera de onboarding cripto?",
      options: [
        "Exigiendo configurar un nodo completo",
        "Integrándose en WhatsApp y abstraendo direcciones hexadecimales complejas",
        "Requiriendo comprar hardware especializado",
      ],
      explanation:
        "El usuario interactúa con contactos y montos familiares, no con jerga blockchain.",
    },
    en: {
      text: "How does MiniPay reduce crypto onboarding barriers?",
      options: [
        "By requiring a full node setup",
        "By integrating in WhatsApp and abstracting complex hex addresses",
        "By requiring specialized hardware purchases",
      ],
      explanation:
        "Users interact with familiar contacts and amounts, not blockchain jargon.",
    },
  },
  {
    category: "minipay",
    difficulty: 3,
    correctIndex: 0,
    es: {
      text: "¿MiniPay puede facilitar inclusión financiera?",
      options: [
        "Sí, al dar acceso a pagos digitales globales con solo un smartphone",
        "No, solo funciona para millonarios",
        "No, requiere cuenta en banco suizo",
      ],
      explanation:
        "La inclusión financiera empieza cuando cualquier persona puede enviar, recibir y ahorrar valor digital.",
    },
    en: {
      text: "Can MiniPay facilitate financial inclusion?",
      options: [
        "Yes, by providing global digital payments access with just a smartphone",
        "No, it only works for millionaires",
        "No, it requires a Swiss bank account",
      ],
      explanation:
        "Financial inclusion starts when anyone can send, receive, and save digital value.",
    },
  },
  {
    category: "minipay",
    difficulty: 3,
    correctIndex: 2,
    es: {
      text: "¿Qué rol juegan los comerciantes en la adopción de MiniPay?",
      options: [
        "Ninguno, MiniPay es solo para especulación",
        "Solo pueden usar MiniPay en computadoras",
        "Aceptar pagos en stablecoins atrae clientes y reduce costos vs. POS tradicionales",
      ],
      explanation:
        "Cuando comerciantes aceptan cUSD, crean liquidez local y casos de uso reales para la comunidad.",
    },
    en: {
      text: "What role do merchants play in MiniPay adoption?",
      options: [
        "None, MiniPay is only for speculation",
        "They can only use MiniPay on computers",
        "Accepting stablecoin payments attracts customers and reduces costs vs. traditional POS",
      ],
      explanation:
        "When merchants accept cUSD, they create local liquidity and real use cases for the community.",
    },
  },
  {
    category: "minipay",
    difficulty: 3,
    correctIndex: 1,
    es: {
      text: "¿Cómo se comparan las remesas con MiniPay vs. servicios tradicionales?",
      options: [
        "MiniPay siempre tarda 2 semanas",
        "MiniPay puede ser más rápido y barato al eliminar intermediarios bancarios",
        "Los servicios tradicionales son siempre gratis",
      ],
      explanation:
        "Transferencias on-chain en Celo se confirman en segundos con comisiones mínimas.",
    },
    en: {
      text: "How do MiniPay remittances compare to traditional services?",
      options: [
        "MiniPay always takes 2 weeks",
        "MiniPay can be faster and cheaper by removing banking intermediaries",
        "Traditional services are always free",
      ],
      explanation:
        "On-chain Celo transfers confirm in seconds with minimal fees.",
    },
  },
  {
    category: "minipay",
    difficulty: 3,
    correctIndex: 0,
    es: {
      text: "¿Qué implica que MiniPay sea no custodial para el usuario?",
      options: [
        "El usuario mantiene control de sus fondos sin depender de un banco intermediario",
        "Un tercero puede mover fondos libremente",
        "Los fondos están garantizados por el FDIC",
      ],
      explanation:
        "La autocustodia alinea con la visión Web3 de empoderar al individuo, no a intermediarios.",
    },
    en: {
      text: "What does MiniPay being non-custodial mean for the user?",
      options: [
        "The user keeps control of funds without relying on a bank intermediary",
        "A third party can move funds freely",
        "Funds are FDIC insured",
      ],
      explanation:
        "Self-custody aligns with Web3's vision of empowering individuals, not intermediaries.",
    },
  },
  {
    category: "minipay",
    difficulty: 3,
    correctIndex: 2,
    es: {
      text: "¿Por qué integrar pagos en WhatsApp es estratégico para Web3 masivo?",
      options: [
        "Porque WhatsApp no tiene usuarios",
        "Porque obliga a aprender Solidity",
        "Porque aprovecha hábitos existentes en lugar de forzar nuevas apps y flujos",
      ],
      explanation:
        "La adopción masiva ocurre cuando la tecnología se vuelve invisible dentro de rutinas diarias.",
    },
    en: {
      text: "Why is integrating payments in WhatsApp strategic for mass Web3 adoption?",
      options: [
        "Because WhatsApp has no users",
        "Because it forces learning Solidity",
        "Because it leverages existing habits instead of forcing new apps and flows",
      ],
      explanation:
        "Mass adoption happens when technology becomes invisible within daily routines.",
    },
  },

  // ========== DIFFICULTY 3 — STABLECOINS (9) ==========
  {
    category: "stablecoins",
    difficulty: 3,
    correctIndex: 1,
    es: {
      text: "¿Cómo funciona el protocolo Mento para mantener el peg de cUSD?",
      options: [
        "Imprimiendo dólares físicos",
        "Mediante expansión/contracción de oferta, reservas y oportunidades de arbitraje",
        "Fijando el precio por decreto gubernamental",
      ],
      explanation:
        "Mento usa incentivos económicos on-chain para que cUSD regrese a ~1 USD cuando se desvía.",
    },
    en: {
      text: "How does the Mento protocol maintain cUSD's peg?",
      options: [
        "By printing physical dollars",
        "Through supply expansion/contraction, reserves, and arbitrage opportunities",
        "By government price decree",
      ],
      explanation:
        "Mento uses on-chain economic incentives so cUSD returns to ~$1 when it deviates.",
    },
  },
  {
    category: "stablecoins",
    difficulty: 3,
    correctIndex: 0,
    es: {
      text: "¿Qué riesgo representa un depeg severo de una stablecoin?",
      options: [
        "Pérdida de confianza y valor para holders y protocolos que dependen de ella",
        "Aumento automático del peg a 10 dólares",
        "Reducción del gas a cero permanentemente",
      ],
      explanation:
        "Depegs históricos han mostrado cómo la confianza en stablecoins puede evaporarse rápidamente.",
    },
    en: {
      text: "What risk does a severe stablecoin depeg pose?",
      options: [
        "Loss of trust and value for holders and dependent protocols",
        "Automatic peg increase to $10",
        "Permanent zero gas",
      ],
      explanation:
        "Historical depegs show how stablecoin trust can evaporate quickly.",
    },
  },
  {
    category: "stablecoins",
    difficulty: 3,
    correctIndex: 2,
    es: {
      text: "¿Por qué las stablecoins son clave para DeFi en mercados emergentes?",
      options: [
        "Porque son imposibles de transferir",
        "Porque aumentan volatilidad",
        "Porque permiten préstamos, ahorro y pagos en moneda familiar sin salir de la cadena",
      ],
      explanation:
        "DeFi con stablecoins locales (cUSD, cREAL) conecta finanzas globales con necesidades locales.",
    },
    en: {
      text: "Why are stablecoins key for DeFi in emerging markets?",
      options: [
        "Because they can't be transferred",
        "Because they increase volatility",
        "Because they enable lending, savings, and payments in familiar currency on-chain",
      ],
      explanation:
        "DeFi with local stablecoins (cUSD, cREAL) connects global finance with local needs.",
    },
  },
  {
    category: "stablecoins",
    difficulty: 3,
    correctIndex: 1,
    es: {
      text: "¿Qué diferencia a cUSD de mantener dólares en efectivo bajo el colchón?",
      options: [
        "cUSD no se puede transferir",
        "cUSD es digital, transferible globalmente en segundos y programmable vía smart contracts",
        "El efectivo es programmable on-chain",
      ],
      explanation:
        "Las stablecoins combinan estabilidad de valor con superpoderes digitales de blockchain.",
    },
    en: {
      text: "How does holding cUSD differ from cash under a mattress?",
      options: [
        "cUSD can't be transferred",
        "cUSD is digital, globally transferable in seconds, and programmable via smart contracts",
        "Cash is programmable on-chain",
      ],
      explanation:
        "Stablecoins combine value stability with blockchain's digital superpowers.",
    },
  },
  {
    category: "stablecoins",
    difficulty: 3,
    correctIndex: 0,
    es: {
      text: "¿Qué es arbitraje en el contexto de stablecoins?",
      options: [
        "Comprar barato y vender caro cuando la stablecoin se desvía del peg para restaurar paridad",
        "Un tipo de NFT",
        "Una comisión de red fija",
      ],
      explanation:
        "Arbitrajistas economicamente incentivados ayudan a mantener stablecoins cerca de su ancla.",
    },
    en: {
      text: "What is arbitrage in the stablecoin context?",
      options: [
        "Buying low and selling high when a stablecoin deviates from peg to restore parity",
        "A type of NFT",
        "A fixed network fee",
      ],
      explanation:
        "Economically incentivized arbitrageurs help keep stablecoins near their anchor.",
    },
  },
  {
    category: "stablecoins",
    difficulty: 3,
    correctIndex: 2,
    es: {
      text: "¿Qué es una stablecoin over-collateralized?",
      options: [
        "Una stablecoin sin respaldo",
        "Una que siempre vale cero",
        "Una respaldada por colateral worth más que la stablecoin emitida",
      ],
      explanation:
        "El sobrecolateral ofrece colchón de seguridad ante caídas del valor del colateral.",
    },
    en: {
      text: "What is an over-collateralized stablecoin?",
      options: [
        "A stablecoin with no backing",
        "One always worth zero",
        "One backed by collateral worth more than the stablecoin issued",
      ],
      explanation:
        "Over-collateralization provides a safety buffer against collateral value drops.",
    },
  },
  {
    category: "stablecoins",
    difficulty: 3,
    correctIndex: 1,
    es: {
      text: "¿Cómo habilitan las stablecoins pagos transfronterizos en Celo?",
      options: [
        "Requiriendo visas internacionales",
        "Permitiendo transferir valor en dólares digitales sin corresponsales bancarios costosos",
        "Solo funcionando dentro de un mismo edificio",
      ],
      explanation:
        "Una transferencia cUSD de Colombia a Kenia puede costar centavos y confirmarse en segundos.",
    },
    en: {
      text: "How do stablecoins enable cross-border payments on Celo?",
      options: [
        "By requiring international visas",
        "By transferring dollar-digital value without costly banking correspondents",
        "By only working within one building",
      ],
      explanation:
        "A cUSD transfer from Colombia to Kenya can cost cents and confirm in seconds.",
    },
  },
  {
    category: "stablecoins",
    difficulty: 3,
    correctIndex: 0,
    es: {
      text: "¿Qué es la composabilidad de stablecoins en DeFi?",
      options: [
        "Usar la misma stablecoin en múltiples protocolos como pieza LEGO financiera",
        "Imprimir stablecoins sin límite",
        "Prohibir transferencias entre usuarios",
      ],
      explanation:
        "Composabilidad permite que cUSD fluya entre préstamos, DEXs y ahorro en un ecosistema integrado.",
    },
    en: {
      text: "What is stablecoin composability in DeFi?",
      options: [
        "Using the same stablecoin across multiple protocols as a financial LEGO piece",
        "Printing unlimited stablecoins",
        "Banning transfers between users",
      ],
      explanation:
        "Composability lets cUSD flow across lending, DEXs, and savings in an integrated ecosystem.",
    },
  },
  {
    category: "stablecoins",
    difficulty: 3,
    correctIndex: 2,
    es: {
      text: "¿Por qué Celo ofrece stablecoins en múltiples monedas (cUSD, cEUR, cREAL)?",
      options: [
        "Para aumentar confusión",
        "Para eliminar pagos locales",
        "Para que usuarios operen en moneda local familiar reduciendo riesgo cambiario percibido",
      ],
      explanation:
        "Stablecoins locales mejoran adopción al reflejar unidades económicas que la gente ya entiende.",
    },
    en: {
      text: "Why does Celo offer stablecoins in multiple currencies (cUSD, cEUR, cREAL)?",
      options: [
        "To increase confusion",
        "To eliminate local payments",
        "So users operate in familiar local currency reducing perceived FX risk",
      ],
      explanation:
        "Local stablecoins improve adoption by reflecting economic units people already understand.",
    },
  },

  // ========== DIFFICULTY 3 — SECURITY (7) ==========
  {
    category: "security",
    difficulty: 3,
    correctIndex: 0,
    es: {
      text: "¿Qué es un ataque de aprobación infinita (infinite approval)?",
      options: [
        "Cuando un contrato malicioso solicita permiso ilimitado para gastar tus tokens",
        "Una actualización legítima de MiniPay",
        "Un tipo de consenso PoS",
      ],
      explanation:
        "Usa approvals limitados o revócalos tras usar una dApp para minimizar exposición.",
    },
    en: {
      text: "What is an infinite approval attack?",
      options: [
        "When a malicious contract requests unlimited permission to spend your tokens",
        "A legitimate MiniPay update",
        "A type of PoS consensus",
      ],
      explanation:
        "Use limited approvals or revoke them after using a dApp to minimize exposure.",
    },
  },
  {
    category: "security",
    difficulty: 3,
    correctIndex: 2,
    es: {
      text: "¿Qué es un dusting attack en blockchain?",
      options: [
        "Limpiar tu wallet con un paño",
        "Un tipo de stablecoin",
        "Enviar cantidades mínimas de tokens a muchas direcciones para rastrear y desanonimizar usuarios",
      ],
      explanation:
        "No interactúes con tokens desconocidos enviados a tu wallet; pueden ser señuelos de rastreo.",
    },
    en: {
      text: "What is a blockchain dusting attack?",
      options: [
        "Cleaning your wallet with a cloth",
        "A type of stablecoin",
        "Sending tiny token amounts to many addresses to track and de-anonymize users",
      ],
      explanation:
        "Don't interact with unknown tokens sent to your wallet; they may be tracking bait.",
    },
  },
  {
    category: "security",
    difficulty: 3,
    correctIndex: 1,
    es: {
      text: "¿Qué es una auditoría de smart contract?",
      options: [
        "Un examen de manejo de efectivo en banco",
        "Revisión de seguridad del código por expertos antes de desplegarlo",
        "Un tipo de wallet fría",
      ],
      explanation:
        "Auditorías reducen riesgos pero no garantizan seguridad absoluta; combínalas con due diligence.",
    },
    en: {
      text: "What is a smart contract audit?",
      options: [
        "A bank cash handling exam",
        "Security code review by experts before deployment",
        "A type of cold wallet",
      ],
      explanation:
        "Audits reduce risk but don't guarantee absolute security; combine with due diligence.",
    },
  },
  {
    category: "security",
    difficulty: 3,
    correctIndex: 0,
    es: {
      text: "¿Qué es el modelo de amenazas para una wallet móvil como MiniPay?",
      options: [
        "Análisis de riesgos: phishing, malware, SIM swap y pérdida del dispositivo",
        "Un tipo de token ERC-20",
        "Un algoritmo de consenso",
      ],
      explanation:
        "Entender amenazas ayuda a activar PIN, biometría y backups seguros según tu contexto.",
    },
    en: {
      text: "What is the threat model for a mobile wallet like MiniPay?",
      options: [
        "Risk analysis: phishing, malware, SIM swap, and device loss",
        "A type of ERC-20 token",
        "A consensus algorithm",
      ],
      explanation:
        "Understanding threats helps you enable PIN, biometrics, and secure backups for your context.",
    },
  },
  {
    category: "security",
    difficulty: 3,
    correctIndex: 2,
    es: {
      text: "¿Qué es un SIM swap attack?",
      options: [
        "Cambiar de operador por mejor señal",
        "Un protocolo DeFi seguro",
        "Cuando un atacante transfiere tu número telefónico a su SIM para interceptar 2FA o identidad",
      ],
      explanation:
        "Protege cuentas críticas con 2FA basado en apps, no SMS, especialmente si usas identidad telefónica.",
    },
    en: {
      text: "What is a SIM swap attack?",
      options: [
        "Switching carriers for better signal",
        "A secure DeFi protocol",
        "When an attacker transfers your phone number to their SIM to intercept 2FA or identity",
      ],
      explanation:
        "Protect critical accounts with app-based 2FA, not SMS, especially if using phone identity.",
    },
  },
  {
    category: "security",
    difficulty: 3,
    correctIndex: 1,
    es: {
      text: "¿Qué es defense in depth en seguridad cripto?",
      options: [
        "Usar una sola contraseña para todo",
        "Múltiples capas de protección: backups offline, 2FA, verificación de direcciones y permisos limitados",
        "Compartir seed phrase con familia",
      ],
      explanation:
        "Ninguna medida es perfecta; combinar capas reduce probabilidad de pérdida total de fondos.",
    },
    en: {
      text: "What is defense in depth in crypto security?",
      options: [
        "Using one password for everything",
        "Multiple protection layers: offline backups, 2FA, address verification, and limited permissions",
        "Sharing seed phrase with family",
      ],
      explanation:
        "No single measure is perfect; combining layers reduces the chance of total fund loss.",
    },
  },
  {
    category: "security",
    difficulty: 3,
    correctIndex: 0,
    es: {
      text: "¿Por qué verificar el hash de una transacción en el explorador es buena práctica?",
      options: [
        "Confirma que la transacción ocurrió on-chain con los detalles esperados",
        "Aumenta el precio de CELO",
        "Genera una nueva seed phrase",
      ],
      explanation:
        "Tras enviar fondos, verifica en CeloScan el monto, destinatario y estado de confirmación.",
    },
    en: {
      text: "Why is verifying a transaction hash on an explorer good practice?",
      options: [
        "It confirms the transaction occurred on-chain with expected details",
        "It increases CELO price",
        "It generates a new seed phrase",
      ],
      explanation:
        "After sending funds, verify on CeloScan the amount, recipient, and confirmation status.",
    },
  },
];
