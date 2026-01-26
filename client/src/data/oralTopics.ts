export interface OralTopic {
    id: number;
    title: string;
    text: string; // Full written passage
    source: string;
}

export const ORAL_TOPICS: OralTopic[] = [
    {
        id: 1,
        title: 'Sujet 1 – Devenez auto-entrepreneur !',
        text:
            "D’un simple clic, le nouveau moyen d’entreprendre ou de compléter ses revenus !\n\nIl est possible de devenir auto-entrepreneur pour augmenter son revenu principal (comme une personne qui\nveut créer sa première affaire en même temps que ses études ou un chômeur qui veut se lancer) ou pour\navoir un revenu complémentaire (comme un salarié du secteur privé, un fonctionnaire ou un retraité qui\nsouhaite développer une activité annexe). L’auto-entrepreneur est libre de s’occuper de son affaire comme\nil le souhaite. La seule condition pour bénéficier de ce statut avantageux est de ne pas dépasser un certain\nmontant de chiffre d’affaires. Celui-ci est limité à 80 000 euros dans les activités d’achat-vente de biens\net à 30 000 euros pour les activités de services. Au même titre que pour son travail de salarié, l’auto-\nentrepreneur déclare ses bénéfices dans le cadre de ses impôts sur le revenu. De plus, les formalités de\ncréation de la micro-entreprise ont été extrêmement simplifiées et peuvent se faire dorénavant par Internet.\nEnfin, il n’est pas nécessaire d’apporter un capital de départ.",
        source: "D’après L’Express, 21/01/2009 et journaldunet.com",
    },
    {
        id: 2,
        title: 'Sujet 2 – Le retour de la sieste au travail ?',
        text:
            "Le temps de sommeil des personnes âgées de 18 à 55 ans continue de diminuer peu à peu. Ainsi en cinquante\nans, le temps moyen de sommeil s’est réduit de 1 h 30 sur 24 heures et 30 % des Français dorment moins\nde 7 heures par jour. C’est pourquoi un programme d’action sur le sommeil a été proposé par le ministère\ndu Travail. Cela a permis d’aborder le sujet de la sieste au travail jugeant que « la question ne devait pas\nêtre taboue ». D’ailleurs, si l’enquête permet d’en valider les effets positifs sur la concentration et la qualité\nau travail, il y est précisé que ce genre de pause devra faire l’objet d’une campagne de promotion. Après la\nlutte contre le tabac, le sommeil est un nouveau terrain sur lequel le ministère veut s’engager. Un dispositif\ndestiné à soigner ceux qui dorment mal va être mis en place car « ce n’est pas normal de mal dormir », a\nrappelé le ministre du Travail.",
        source: "D’après Fabien Fournier, Le Figaro, 31/07/2009",
    },
    {
        id: 3,
        title: 'Sujet 3 – Comment dynamiser son niveau en langues ?',
        text:
            "Difficile de progresser en se contentant simplement des cours ! Parfois, il est difficile d’avouer qu’après six\nou sept ans de cours de langue, on est incapable de dire ou d’écrire quoi que ce soit de compréhensible\ndans une langue étrangère. Lycéens, étudiants ou salariés et tous ceux qui souhaitent améliorer leur niveau\nlinguistique doivent savoir que la seule manière d’y parvenir est de travailler régulièrement pour avancer.\nPour cela, certains conseilleraient de réviser la grammaire et la conjugaison : « rien de tel que de pratiquer\nrégulièrement en effectuant des exercices afin d’acquérir des automatismes » pour progresser. Mais apprendre\ndes phrases clés, afin de retenir plus vite les mots, aide-t-il vraiment à exprimer votre pensée ? Il vaut mieux\nlire, écouter la radio ou feuilleter la presse pour gagner en réflexion et en aisance tout en se cultivant.\nReste à savoir quelle méthode personnelle est la plus efficace pour réussir à communiquer dans une langue\nétrangère.",
        source: 'D’après L’Express, 21/01/2009',
    },
    {
        id: 4,
        title: 'Sujet 4 – L’industrie au féminin !',
        text:
            "En France, plus d’1,2 million de femmes travaillent dans l’industrie, soit 30 % des salariés du secteur.\nDepuis 10 ans, les 2/3 des emplois qui ont été créés dans l’industrie pour les cadres concernent des femmes.\nEn général, elles occupent la moitié des emplois dans le textile et l’habillement, le cuir et les chaussures,\ndans l’agro-alimentaire, dans la chimie et même dans la métallurgie. Vous l’avez donc compris, le secteur de\nl’industrie est ouvert aux femmes, mais elles sont moins nombreuses que les hommes car elles s’orientent\nplus vers des filières générales et de services. Toutefois dès qu’elles choisissent des filières professionnelles et\nde production, elles s’intègrent dans l’industrie aussi bien que les hommes. Il y a 30 ans, la part de femmes\ningénieurs et cadres dans l’industrie était de 5,2 %, aujourd’hui, elle est de 16 %. Les femmes représentent\nainsi 20 % des chercheurs dans les entreprises industrielles, un chiffre qui reste bien inférieur à celui des\nhommes. Peut-on imaginer une évolution vers la parité ?",
        source: 'D’après Aziza Sellam, Métro, 27/04/2009',
    },
    {
        id: 5,
        title: 'Sujet 5 – Quels sont les éléments clés pour une candidature réussie ?',
        text:
            "Tout d’abord, il est nécessaire de faire un travail de réflexion personnel : mettre en valeur ses atouts, ses\npoints d’amélioration et ses aspirations professionnelles. Nous savons qu’il n’est pas simple, surtout pour un\njeune diplômé, de construire un projet professionnel mais les candidats doivent absolument consacrer du\ntemps à cette réflexion avant toute démarche auprès d’un employeur potentiel. Ensuite, il faut analyser les\nraisons pour lesquelles son profil peut correspondre aux besoins de l’entreprise et les mettre en avant. Pour\ncela, il est recommandé de faire des recherches sur l’entreprise convoitée et ses métiers. La démarche doit\nêtre construite : quel poste me correspond le mieux ?, quelles sont les qualités pour y répondre ?… Pour\nfaciliter cette préparation, il ne faut pas hésiter à aller dans des salons professionnels, à la rencontre des\nrecruteurs, pour échanger, prendre des informations sur le secteur qui vous intéresse, sur les postes et les\ncarrières possibles … « Arriver lors de l’entretien avec un projet et un argumentaire bien préparé fait souvent\nla différence ».",
        source: 'studyrama.com, avril 2009',
    },
    {
        id: 6,
        title: 'Sujet 6 – L’alternance, une solution d’avenir',
        text:
            "L’insertion des jeunes dans l’emploi peut emprunter une voie qui semble devenir prioritaire : l’alternance.\nLe nombre de contrats d’apprentissage et de professionnalisation augmente régulièrement depuis plusieurs\nannées. Cependant, les contrats de professionnalisation pourraient mieux se développer car ils s’adressent\nà des personnes plus qualifiées, de niveau baccalauréat au moins, et concernent des secteurs plus divers.\nÀ travers les contrats d’apprentissage ou ceux de professionnalisation, de plus en plus de jeunes sont amenés\nà obtenir des diplômes ou des qualifications professionnelles en alternant les cours dans un centre de for-\nmation et le travail au sein d’une entreprise ou d’un service public. Selon le ministère du Travail, le nombre\nde jeunes entre 16 et 25 ans en apprentissage était estimé à plus de 400 000 en 2008 et est en constante\nprogression. L’objectif est d’augmenter encore le nombre de contrats en alternance afin de faciliter et\nd’accélérer l’insertion des jeunes dans l’emploi.",
        source: 'D’après Manuel Jardinaud, Métro, 28/04/2009',
    },
];


