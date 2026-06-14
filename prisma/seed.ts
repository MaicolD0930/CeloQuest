import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type SeedQuestion = {
  category: "blockchain" | "wallets" | "celo" | "minipay" | "stablecoins";
  difficulty: number;
  correctIndex: number;
  es: { text: string; options: string[]; explanation: string };
  en: { text: string; options: string[]; explanation: string };
};

const questions: SeedQuestion[] = [
  // ---------- BLOCKCHAIN ----------
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
        "Una blockchain es como un libro contable digital que se copia en miles de computadoras. Nadie puede borrarlo ni alterarlo, por eso es tan confiable.",
    },
    en: {
      text: "What is a blockchain?",
      options: [
        "A technology company",
        "A distributed, immutable digital ledger of transactions",
        "A type of physical coin",
      ],
      explanation:
        "A blockchain is like a digital ledger copied across thousands of computers. No one can erase or alter it, which is why it is so trustworthy.",
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
        "Descentralizada significa que la red es mantenida por miles de participantes en todo el mundo, sin un dueño único que pueda controlarla o apagarla.",
    },
    en: {
      text: "What does it mean for a blockchain to be 'decentralized'?",
      options: [
        "It does not depend on a single entity or central server",
        "It is located in a single country",
        "Only banks can use it",
      ],
      explanation:
        "Decentralized means the network is maintained by thousands of participants around the world, with no single owner who can control or shut it down.",
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
        "Cada vez que envías cripto, esa operación queda registrada para siempre en la blockchain y cualquiera puede verificarla.",
    },
    en: {
      text: "What is a blockchain transaction?",
      options: [
        "An encrypted email",
        "A printed legal document",
        "A transfer of value permanently recorded on the network",
      ],
      explanation:
        "Every time you send crypto, that operation is recorded forever on the blockchain and anyone can verify it.",
    },
  },
  {
    category: "blockchain",
    difficulty: 2,
    correctIndex: 1,
    es: {
      text: "¿Qué es un 'smart contract' (contrato inteligente)?",
      options: [
        "Un contrato firmado por un abogado experto",
        "Un programa que se ejecuta automáticamente en la blockchain",
        "Un acuerdo verbal entre dos personas",
      ],
      explanation:
        "Un smart contract es código que vive en la blockchain y se ejecuta solo cuando se cumplen las condiciones. Sin intermediarios.",
    },
    en: {
      text: "What is a 'smart contract'?",
      options: [
        "A contract signed by an expert lawyer",
        "A program that runs automatically on the blockchain",
        "A verbal agreement between two people",
      ],
      explanation:
        "A smart contract is code that lives on the blockchain and executes automatically when conditions are met. No intermediaries needed.",
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
        "El gas es la pequeña tarifa que paga quien envía una transacción para compensar a la red. En Celo estas tarifas son muy bajas, ¡y puedes pagarlas con stablecoins!",
    },
    en: {
      text: "What is 'gas' on a blockchain network?",
      options: [
        "The fee paid to process a transaction",
        "Physical fuel for the servers",
        "A token exclusive to Bitcoin",
      ],
      explanation:
        "Gas is the small fee paid by whoever sends a transaction to compensate the network. On Celo these fees are very low, and you can even pay them with stablecoins!",
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
        "Para falsificar una blockchain tendrías que hackear miles de computadoras al mismo tiempo. Por eso la red es tan segura.",
    },
    en: {
      text: "Why is it hard to falsify information on a blockchain?",
      options: [
        "Because the police monitor it",
        "Because it is stored on paper",
        "Because thousands of nodes verify and share the same record",
      ],
      explanation:
        "To falsify a blockchain you would need to hack thousands of computers at the same time. That is why the network is so secure.",
    },
  },
  // ---------- WALLETS ----------
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
        "Una wallet es tu puerta de entrada a Web3: guarda tus llaves privadas y te permite enviar, recibir y gestionar tus activos digitales.",
    },
    en: {
      text: "What is a wallet?",
      options: [
        "A traditional bank account",
        "A tool to store and manage your crypto assets",
        "A credit card",
      ],
      explanation:
        "A wallet is your gateway to Web3: it stores your private keys and lets you send, receive, and manage your digital assets.",
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
        "La seed phrase son 12 o 24 palabras que funcionan como la llave maestra de tu wallet. Nunca la compartas con nadie.",
    },
    en: {
      text: "What is a wallet's recovery phrase (seed phrase)?",
      options: [
        "A list of secret words that lets you recover your wallet",
        "Your wallet's username",
        "A promo code",
      ],
      explanation:
        "The seed phrase is 12 or 24 words that act as the master key to your wallet. Never share it with anyone.",
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
        "Tu llave privada es como la llave de tu casa. Cualquiera que la tenga puede tomar todos tus fondos. Ningún soporte legítimo te la pedirá.",
    },
    en: {
      text: "If someone asks for your private key or seed phrase, what should you do?",
      options: [
        "Share it if they seem trustworthy",
        "Only send it via WhatsApp",
        "Never share it: whoever has it controls your funds",
      ],
      explanation:
        "Your private key is like the key to your house. Anyone who has it can take all your funds. No legitimate support team will ever ask for it.",
    },
  },
  {
    category: "wallets",
    difficulty: 2,
    correctIndex: 1,
    es: {
      text: "¿Qué es una dirección pública de wallet?",
      options: [
        "Tu contraseña secreta",
        "Un identificador que puedes compartir para recibir fondos",
        "Tu número de documento de identidad",
      ],
      explanation:
        "La dirección pública (como 0x123...) es como tu número de cuenta: puedes compartirla libremente para que te envíen activos.",
    },
    en: {
      text: "What is a wallet's public address?",
      options: [
        "Your secret password",
        "An identifier you can share to receive funds",
        "Your ID number",
      ],
      explanation:
        "The public address (like 0x123...) is like your account number: you can share it freely so people can send you assets.",
    },
  },
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
        "En una wallet no custodial (como MiniPay), tú tienes el control total de tus llaves y fondos. En una custodial, un tercero los guarda por ti.",
    },
    en: {
      text: "What is the difference between a custodial and a non-custodial wallet?",
      options: [
        "In a non-custodial wallet, only you control the private keys",
        "Custodial wallets are always free",
        "There is no difference",
      ],
      explanation:
        "In a non-custodial wallet (like MiniPay), you have full control of your keys and funds. In a custodial one, a third party holds them for you.",
    },
  },
  // ---------- CELO ----------
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
        "Celo es una blockchain de capa 2 diseñada para que cualquier persona con un celular pueda acceder a herramientas financieras de forma simple y barata.",
    },
    en: {
      text: "What is Celo?",
      options: [
        "A social network",
        "A blockchain focused on mobile payments and global accessibility",
        "A digital bank from Colombia",
      ],
      explanation:
        "Celo is a layer-2 blockchain designed so that anyone with a phone can access financial tools simply and cheaply.",
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
        "Celo nació con visión 'mobile-first': transacciones rápidas, comisiones de fracciones de centavo y la posibilidad de pagar el gas con stablecoins.",
    },
    en: {
      text: "What makes Celo special compared to other blockchains?",
      options: [
        "It is optimized for mobile phones and has very low fees",
        "It only works on desktop computers",
        "It requires expensive mining equipment",
      ],
      explanation:
        "Celo was born with a mobile-first vision: fast transactions, fees of fractions of a cent, and the ability to pay gas with stablecoins.",
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
        "CELO es el token nativo de la red. Se usa para gobernanza y para pagar comisiones, aunque en Celo también puedes pagar el gas con stablecoins.",
    },
    en: {
      text: "What is the native token of the Celo network?",
      options: ["BTC", "ETH", "CELO"],
      explanation:
        "CELO is the network's native token. It is used for governance and fees, although on Celo you can also pay gas with stablecoins.",
    },
  },
  {
    category: "celo",
    difficulty: 2,
    correctIndex: 1,
    es: {
      text: "¿Qué puedes hacer con Celo en la vida real?",
      options: [
        "Solo especular con precios",
        "Enviar dinero a cualquier parte del mundo en segundos y con costos mínimos",
        "Nada, es solo tecnología experimental",
      ],
      explanation:
        "Con Celo puedes enviar remesas, pagar, ahorrar en stablecoins y acceder a servicios financieros desde tu celular, sin necesidad de un banco.",
    },
    en: {
      text: "What can you do with Celo in real life?",
      options: [
        "Only speculate on prices",
        "Send money anywhere in the world in seconds with minimal costs",
        "Nothing, it is just experimental technology",
      ],
      explanation:
        "With Celo you can send remittances, pay, save in stablecoins, and access financial services from your phone, no bank needed.",
    },
  },
  {
    category: "celo",
    difficulty: 2,
    correctIndex: 0,
    es: {
      text: "¿Qué es cCOP en el ecosistema Celo?",
      options: [
        "Una stablecoin vinculada al peso colombiano",
        "Una empresa de café colombiana",
        "Un videojuego",
      ],
      explanation:
        "cCOP es una stablecoin del ecosistema Celo cuyo valor sigue al peso colombiano, ideal para pagos y ahorro local sin volatilidad.",
    },
    en: {
      text: "What is cCOP in the Celo ecosystem?",
      options: [
        "A stablecoin pegged to the Colombian peso",
        "A Colombian coffee company",
        "A video game",
      ],
      explanation:
        "cCOP is a Celo ecosystem stablecoin whose value tracks the Colombian peso, ideal for local payments and savings without volatility.",
    },
  },
  {
    category: "celo",
    difficulty: 2,
    correctIndex: 2,
    es: {
      text: "¿Con qué puedes pagar las comisiones (gas) en Celo?",
      options: [
        "Solo con tarjeta de crédito",
        "Solo con Bitcoin",
        "Con CELO o incluso con stablecoins como USDC",
      ],
      explanation:
        "Una gran ventaja de Celo: no necesitas el token nativo para mover tus fondos. Puedes pagar el gas directamente con stablecoins.",
    },
    en: {
      text: "What can you pay transaction fees (gas) with on Celo?",
      options: [
        "Only with a credit card",
        "Only with Bitcoin",
        "With CELO or even with stablecoins like USDC",
      ],
      explanation:
        "A big advantage of Celo: you don't need the native token to move your funds. You can pay gas directly with stablecoins.",
    },
  },
  // ---------- MINIPAY ----------
  {
    category: "minipay",
    difficulty: 1,
    correctIndex: 0,
    es: {
      text: "¿Qué es MiniPay?",
      options: [
        "Una wallet ligera y sencilla construida sobre Celo",
        "Una tarjeta de débito física",
        "Una app para pedir comida",
      ],
      explanation:
        "MiniPay es una wallet no custodial súper liviana (menos de 2 MB) integrada en Opera Mini y disponible como app, diseñada para enviar stablecoins fácil y barato.",
    },
    en: {
      text: "What is MiniPay?",
      options: [
        "A lightweight, simple wallet built on Celo",
        "A physical debit card",
        "A food delivery app",
      ],
      explanation:
        "MiniPay is a super lightweight non-custodial wallet (under 2 MB) built into Opera Mini and available as an app, designed to send stablecoins easily and cheaply.",
    },
  },
  {
    category: "minipay",
    difficulty: 1,
    correctIndex: 1,
    es: {
      text: "¿Qué necesitas para crear una cuenta en MiniPay?",
      options: [
        "Una cuenta bancaria verificada",
        "Solo un número de teléfono o cuenta de Google",
        "Un mínimo de 100 dólares",
      ],
      explanation:
        "MiniPay hace el onboarding muy fácil: te registras con tu teléfono o Google y en segundos tienes una wallet lista para usar.",
    },
    en: {
      text: "What do you need to create a MiniPay account?",
      options: [
        "A verified bank account",
        "Just a phone number or Google account",
        "A minimum of 100 dollars",
      ],
      explanation:
        "MiniPay makes onboarding very easy: you sign up with your phone or Google and in seconds you have a wallet ready to use.",
    },
  },
  {
    category: "minipay",
    difficulty: 1,
    correctIndex: 2,
    es: {
      text: "¿Qué tipo de activos maneja principalmente MiniPay?",
      options: [
        "Acciones de empresas",
        "Solo Bitcoin",
        "Stablecoins como USDC, USDT y cUSD",
      ],
      explanation:
        "MiniPay está pensada para la vida diaria: maneja stablecoins, que mantienen su valor estable y sirven para pagar, ahorrar y enviar dinero.",
    },
    en: {
      text: "What kind of assets does MiniPay mainly handle?",
      options: [
        "Company stocks",
        "Only Bitcoin",
        "Stablecoins like USDC, USDT, and cUSD",
      ],
      explanation:
        "MiniPay is designed for daily life: it handles stablecoins, which keep a stable value and are great for paying, saving, and sending money.",
    },
  },
  {
    category: "minipay",
    difficulty: 2,
    correctIndex: 0,
    es: {
      text: "¿Cuánto cuesta aproximadamente enviar dinero con MiniPay?",
      options: [
        "Menos de un centavo de dólar",
        "Un 5% del monto enviado",
        "10 dólares fijos por envío",
      ],
      explanation:
        "Gracias a la red Celo, las transacciones en MiniPay cuestan fracciones de centavo. Por eso es ideal para remesas y pagos pequeños.",
    },
    en: {
      text: "Approximately how much does it cost to send money with MiniPay?",
      options: [
        "Less than one cent",
        "5% of the amount sent",
        "A flat 10 dollars per transfer",
      ],
      explanation:
        "Thanks to the Celo network, MiniPay transactions cost fractions of a cent. That is why it is ideal for remittances and small payments.",
    },
  },
  {
    category: "minipay",
    difficulty: 2,
    correctIndex: 1,
    es: {
      text: "¿MiniPay es una wallet custodial o no custodial?",
      options: [
        "Custodial: Opera guarda tus fondos",
        "No custodial: solo tú controlas tus llaves y fondos",
        "Depende del país donde vivas",
      ],
      explanation:
        "MiniPay es no custodial: tus llaves se generan y guardan en tu dispositivo. Nadie más puede mover tus fondos.",
    },
    en: {
      text: "Is MiniPay a custodial or non-custodial wallet?",
      options: [
        "Custodial: Opera holds your funds",
        "Non-custodial: only you control your keys and funds",
        "It depends on the country you live in",
      ],
      explanation:
        "MiniPay is non-custodial: your keys are generated and stored on your device. No one else can move your funds.",
    },
  },
  {
    category: "minipay",
    difficulty: 2,
    correctIndex: 2,
    es: {
      text: "¿Qué son las 'Mini Apps' dentro de MiniPay?",
      options: [
        "Juegos precargados en el teléfono",
        "Versiones pequeñas de apps bancarias",
        "Aplicaciones Web3 que funcionan dentro de la wallet",
      ],
      explanation:
        "MiniPay incluye un ecosistema de Mini Apps: dapps que corren dentro de la wallet para ahorrar, ganar recompensas y más. ¡CeloQuest es una de ellas!",
    },
    en: {
      text: "What are 'Mini Apps' inside MiniPay?",
      options: [
        "Games preloaded on the phone",
        "Small versions of banking apps",
        "Web3 applications that run inside the wallet",
      ],
      explanation:
        "MiniPay includes a Mini Apps ecosystem: dapps that run inside the wallet for saving, earning rewards, and more. CeloQuest is one of them!",
    },
  },
  // ---------- STABLECOINS ----------
  {
    category: "stablecoins",
    difficulty: 1,
    correctIndex: 1,
    es: {
      text: "¿Qué es una stablecoin?",
      options: [
        "Una criptomoneda que cambia constantemente de precio",
        "Un activo digital diseñado para mantener estabilidad de valor",
        "Una wallet",
      ],
      explanation:
        "Una stablecoin mantiene su valor estable porque está vinculada a un activo como el dólar. Te da la utilidad de la cripto sin la volatilidad.",
    },
    en: {
      text: "What is a stablecoin?",
      options: [
        "A cryptocurrency that constantly changes in price",
        "A digital asset designed to maintain a stable value",
        "A wallet",
      ],
      explanation:
        "A stablecoin keeps a stable value because it is pegged to an asset like the dollar. You get the utility of crypto without the volatility.",
    },
  },
  {
    category: "stablecoins",
    difficulty: 1,
    correctIndex: 0,
    es: {
      text: "¿A qué está vinculado normalmente el valor de USDC?",
      options: [
        "Al dólar estadounidense (1 USDC ≈ 1 USD)",
        "Al precio del oro",
        "Al precio de Bitcoin",
      ],
      explanation:
        "USDC es una stablecoin respaldada por reservas en dólares. Cada USDC está diseñado para valer aproximadamente 1 dólar.",
    },
    en: {
      text: "What is USDC's value normally pegged to?",
      options: [
        "The US dollar (1 USDC ≈ 1 USD)",
        "The price of gold",
        "The price of Bitcoin",
      ],
      explanation:
        "USDC is a stablecoin backed by dollar reserves. Each USDC is designed to be worth approximately 1 dollar.",
    },
  },
  {
    category: "stablecoins",
    difficulty: 1,
    correctIndex: 2,
    es: {
      text: "¿Para qué sirven las stablecoins en el día a día?",
      options: [
        "Solo para minar criptomonedas",
        "Para coleccionar arte digital",
        "Para pagar, ahorrar y enviar dinero sin volatilidad",
      ],
      explanation:
        "Las stablecoins combinan lo mejor de dos mundos: la rapidez y bajo costo de la cripto con la estabilidad del dinero tradicional.",
    },
    en: {
      text: "What are stablecoins useful for in daily life?",
      options: [
        "Only for mining cryptocurrencies",
        "For collecting digital art",
        "For paying, saving, and sending money without volatility",
      ],
      explanation:
        "Stablecoins combine the best of both worlds: the speed and low cost of crypto with the stability of traditional money.",
    },
  },
  {
    category: "stablecoins",
    difficulty: 2,
    correctIndex: 1,
    es: {
      text: "¿Qué es cUSD en el ecosistema Celo?",
      options: [
        "Un exchange de criptomonedas",
        "Una stablecoin de Celo vinculada al dólar",
        "Un protocolo de videojuegos",
      ],
      explanation:
        "cUSD (Celo Dollar) es la stablecoin nativa de Celo vinculada al dólar. Se usa para pagos y transferencias dentro del ecosistema.",
    },
    en: {
      text: "What is cUSD in the Celo ecosystem?",
      options: [
        "A cryptocurrency exchange",
        "A Celo stablecoin pegged to the dollar",
        "A gaming protocol",
      ],
      explanation:
        "cUSD (Celo Dollar) is Celo's native stablecoin pegged to the dollar. It is used for payments and transfers within the ecosystem.",
    },
  },
  {
    category: "stablecoins",
    difficulty: 2,
    correctIndex: 0,
    es: {
      text: "¿Por qué las stablecoins son útiles para enviar remesas?",
      options: [
        "Porque llegan en segundos y con comisiones mínimas",
        "Porque requieren ir a una oficina física",
        "Porque solo funcionan los días hábiles",
      ],
      explanation:
        "Una remesa tradicional puede costar 5-10% y tardar días. Con stablecoins en Celo, llega en segundos y cuesta menos de un centavo.",
    },
    en: {
      text: "Why are stablecoins useful for sending remittances?",
      options: [
        "Because they arrive in seconds with minimal fees",
        "Because they require visiting a physical office",
        "Because they only work on business days",
      ],
      explanation:
        "A traditional remittance can cost 5-10% and take days. With stablecoins on Celo, it arrives in seconds and costs less than a cent.",
    },
  },
  {
    category: "stablecoins",
    difficulty: 2,
    correctIndex: 2,
    es: {
      text: "Si tienes 10 USDC hoy, ¿cuánto valdrán aproximadamente mañana?",
      options: [
        "Podrían valer el doble",
        "Podrían no valer nada",
        "Aproximadamente 10 dólares, porque su valor es estable",
      ],
      explanation:
        "Esa es la magia de las stablecoins: su valor se mantiene estable en el tiempo, a diferencia de criptomonedas volátiles como Bitcoin.",
    },
    en: {
      text: "If you have 10 USDC today, how much will it be worth tomorrow?",
      options: [
        "It could double in value",
        "It could be worth nothing",
        "Approximately 10 dollars, because its value is stable",
      ],
      explanation:
        "That is the magic of stablecoins: their value stays stable over time, unlike volatile cryptocurrencies like Bitcoin.",
    },
  },
  // ---------- EXTRA MIX ----------
  {
    category: "blockchain",
    difficulty: 1,
    correctIndex: 0,
    es: {
      text: "¿Qué significa 'Web3'?",
      options: [
        "Una internet donde los usuarios son dueños de sus datos y activos",
        "La tercera versión de Google",
        "Un navegador web nuevo",
      ],
      explanation:
        "Web3 es la evolución de internet: en lugar de que las plataformas controlen todo, tú eres dueño de tu identidad, tus datos y tu dinero.",
    },
    en: {
      text: "What does 'Web3' mean?",
      options: [
        "An internet where users own their data and assets",
        "The third version of Google",
        "A new web browser",
      ],
      explanation:
        "Web3 is the evolution of the internet: instead of platforms controlling everything, you own your identity, your data, and your money.",
    },
  },
  {
    category: "celo",
    difficulty: 1,
    correctIndex: 1,
    es: {
      text: "¿Cuál es la misión principal de Celo?",
      options: [
        "Reemplazar a todos los bancos del mundo",
        "Crear condiciones de prosperidad para todos, con herramientas financieras accesibles",
        "Vender teléfonos celulares",
      ],
      explanation:
        "La misión de Celo es 'prosperity for all': llevar herramientas financieras a los miles de millones de personas que tienen celular pero no acceso a banca.",
    },
    en: {
      text: "What is Celo's main mission?",
      options: [
        "To replace every bank in the world",
        "To create conditions of prosperity for everyone, with accessible financial tools",
        "To sell mobile phones",
      ],
      explanation:
        "Celo's mission is 'prosperity for all': bringing financial tools to the billions of people who have a phone but no access to banking.",
    },
  },
];

async function main() {
  const force =
    process.env.FORCE_SEED === "1" || process.argv.includes("--force");
  const existing = await prisma.question.count();

  if (existing > 0 && !force) {
    console.log(`Database already has ${existing} questions — skipping seed.`);
    console.log("To re-seed: npm run db:seed:force");
    return;
  }

  if (force && existing > 0) {
    console.log("FORCE_SEED: clearing questions...");
    await prisma.questionTranslation.deleteMany();
    await prisma.question.deleteMany();
  }

  console.log("Seeding database...");
  for (const q of questions) {
    await prisma.question.create({
      data: {
        category: q.category,
        difficulty: q.difficulty,
        correctIndex: q.correctIndex,
        translations: {
          create: [
            {
              locale: "es",
              text: q.es.text,
              options: JSON.stringify(q.es.options),
              explanation: q.es.explanation,
            },
            {
              locale: "en",
              text: q.en.text,
              options: JSON.stringify(q.en.options),
              explanation: q.en.explanation,
            },
          ],
        },
      },
    });
  }

  const count = await prisma.question.count();
  console.log(`Seeded ${count} questions.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
