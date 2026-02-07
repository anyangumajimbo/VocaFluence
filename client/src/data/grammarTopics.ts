// Grammar Topics Data Structure
export interface GrammarTopic {
  id: string;
  language: 'french';
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'B3' | 'C1';
  topicOrder: number;
  name: string; // English name
  frenchName: string;
}

export interface GrammarLesson {
  topicId: string;
  language: 'french';
  level: 'A1' | 'A2' | 'B1' | 'B2';
  day: 1 | 2 | 3 | 4 | 5 | 6;
  title: string;
  explanation: string;
  exampleSentences: string[];
}

export interface StudentGrammarProgress {
  topicId: string;
  language: 'french';
  level: 'A1' | 'A2' | 'B1' | 'B2';
  currentDay: 1 | 2 | 3 | 4 | 5 | 6;
  completed: boolean;
  scores: {
    day1?: number;
    day2?: number;
    day3?: number;
    day4?: number;
    day5?: number;
    day6?: number;
  };
  lastAccessedAt?: Date;
  completedAt?: Date;
}

// All French Grammar Topics (A1-B2)
export const grammarTopics: GrammarTopic[] = [
  // A1 Level (13 topics)
  { id: 'a1-01', language: 'french', level: 'A1', topicOrder: 1, name: 'Personal Pronouns', frenchName: 'Pronoms personnels' },
  { id: 'a1-02', language: 'french', level: 'A1', topicOrder: 2, name: 'Verb "To Be" (Être)', frenchName: 'Le verbe être' },
  { id: 'a1-03', language: 'french', level: 'A1', topicOrder: 3, name: 'Verb "To Have" (Avoir)', frenchName: 'Le verbe avoir' },
  { id: 'a1-04', language: 'french', level: 'A1', topicOrder: 4, name: 'Present Indicative - Regular -ER Verbs', frenchName: 'Présent indicatif - verbes réguliers -ER' },
  { id: 'a1-05', language: 'french', level: 'A1', topicOrder: 5, name: 'Present Indicative - Regular -IR Verbs', frenchName: 'Présent indicatif - verbes réguliers -IR' },
  { id: 'a1-06', language: 'french', level: 'A1', topicOrder: 6, name: 'Present Indicative - Regular -RE Verbs', frenchName: 'Présent indicatif - verbes réguliers -RE' },
  { id: 'a1-07', language: 'french', level: 'A1', topicOrder: 7, name: 'Definite Articles', frenchName: 'Les articles définis' },
  { id: 'a1-08', language: 'french', level: 'A1', topicOrder: 8, name: 'Indefinite Articles', frenchName: 'Les articles indéfinis' },
  { id: 'a1-09', language: 'french', level: 'A1', topicOrder: 9, name: 'Noun Gender and Number', frenchName: 'Genre et nombre des noms' },
  { id: 'a1-10', language: 'french', level: 'A1', topicOrder: 10, name: 'Adjective Agreement', frenchName: 'Accord des adjectifs' },
  { id: 'a1-11', language: 'french', level: 'A1', topicOrder: 11, name: 'Basic Prepositions', frenchName: 'Prépositions basiques' },
  { id: 'a1-12', language: 'french', level: 'A1', topicOrder: 12, name: 'Question Formation', frenchName: 'Formation des questions' },
  { id: 'a1-13', language: 'french', level: 'A1', topicOrder: 13, name: 'Negation (Ne...Pas)', frenchName: 'Négation (ne...pas)' },

  // A2 Level (18 topics)
  { id: 'a2-01', language: 'french', level: 'A2', topicOrder: 14, name: 'Possessive Adjectives', frenchName: 'Adjectifs possessifs' },
  { id: 'a2-02', language: 'french', level: 'A2', topicOrder: 15, name: 'Demonstrative Adjectives', frenchName: 'Adjectifs démonstratifs' },
  { id: 'a2-03', language: 'french', level: 'A2', topicOrder: 16, name: 'Partitive Articles', frenchName: 'Articles partitifs' },
  { id: 'a2-04', language: 'french', level: 'A2', topicOrder: 17, name: 'Direct Object Pronouns', frenchName: 'Pronoms compléments d\'objet direct' },
  { id: 'a2-05', language: 'french', level: 'A2', topicOrder: 18, name: 'Indirect Object Pronouns', frenchName: 'Pronoms compléments d\'objet indirect' },
  { id: 'a2-06', language: 'french', level: 'A2', topicOrder: 19, name: 'Present Indicative - Irregular Verbs', frenchName: 'Présent indicatif - verbes irréguliers' },
  { id: 'a2-07', language: 'french', level: 'A2', topicOrder: 20, name: 'Passé Composé', frenchName: 'Passé composé' },
  { id: 'a2-08', language: 'french', level: 'A2', topicOrder: 21, name: 'Imparfait', frenchName: 'Imparfait' },
  { id: 'a2-09', language: 'french', level: 'A2', topicOrder: 22, name: 'Comparative Adjectives', frenchName: 'Adjectifs comparatifs' },
  { id: 'a2-10', language: 'french', level: 'A2', topicOrder: 23, name: 'Superlative Adjectives', frenchName: 'Adjectifs superlatifs' },
  { id: 'a2-11', language: 'french', level: 'A2', topicOrder: 24, name: 'Comparative Adverbs', frenchName: 'Adverbes comparatifs' },
  { id: 'a2-12', language: 'french', level: 'A2', topicOrder: 25, name: 'Superlative Adverbs', frenchName: 'Adverbes superlatifs' },
  { id: 'a2-13', language: 'french', level: 'A2', topicOrder: 26, name: 'Near Future (Aller + Infinitive)', frenchName: 'Futur proche (aller + infinitif)' },
  { id: 'a2-14', language: 'french', level: 'A2', topicOrder: 27, name: 'Conditional Present', frenchName: 'Conditionnel présent' },
  { id: 'a2-15', language: 'french', level: 'A2', topicOrder: 28, name: 'Relative Pronouns (Qui, Que)', frenchName: 'Pronoms relatifs (qui, que)' },
  { id: 'a2-16', language: 'french', level: 'A2', topicOrder: 29, name: 'Reflexive Verbs', frenchName: 'Verbes pronominaux' },
  { id: 'a2-17', language: 'french', level: 'A2', topicOrder: 30, name: 'Past Participle Agreement', frenchName: 'Accord du participe passé' },
  { id: 'a2-18', language: 'french', level: 'A2', topicOrder: 31, name: 'More Prepositions', frenchName: 'Plus de prépositions' },

  // B1 Level (17 topics)
  { id: 'b1-01', language: 'french', level: 'B1', topicOrder: 32, name: 'Pluperfect (Plus-que-parfait)', frenchName: 'Plus-que-parfait' },
  { id: 'b1-02', language: 'french', level: 'B1', topicOrder: 33, name: 'Simple Future Tense', frenchName: 'Futur simple' },
  { id: 'b1-03', language: 'french', level: 'B1', topicOrder: 34, name: 'Simple Past Tense (Passé Simple)', frenchName: 'Passé simple' },
  { id: 'b1-04', language: 'french', level: 'B1', topicOrder: 35, name: 'Present Subjunctive', frenchName: 'Subjonctif présent' },
  { id: 'b1-05', language: 'french', level: 'B1', topicOrder: 36, name: 'Subjunctive vs Indicative Usage', frenchName: 'Utilisation du subjonctif vs indicatif' },
  { id: 'b1-06', language: 'french', level: 'B1', topicOrder: 37, name: 'Stressed Pronouns (Toniques)', frenchName: 'Pronoms toniques' },
  { id: 'b1-07', language: 'french', level: 'B1', topicOrder: 38, name: 'Relative Pronouns (Dont, Où)', frenchName: 'Pronoms relatifs (dont, où)' },
  { id: 'b1-08', language: 'french', level: 'B1', topicOrder: 39, name: 'Y and EN Pronouns', frenchName: 'Pronoms y et en' },
  { id: 'b1-09', language: 'french', level: 'B1', topicOrder: 40, name: 'Present Participle and Gerund', frenchName: 'Participe présent et gérondif' },
  { id: 'b1-10', language: 'french', level: 'B1', topicOrder: 41, name: 'Causative Construction (Faire + Infinitive)', frenchName: 'Construction causative (faire + infinitif)' },
  { id: 'b1-11', language: 'french', level: 'B1', topicOrder: 42, name: 'Passive Voice', frenchName: 'Voix passive' },
  { id: 'b1-12', language: 'french', level: 'B1', topicOrder: 43, name: 'Conditional Clauses (Si...)', frenchName: 'Phrases conditionnelles' },
  { id: 'b1-13', language: 'french', level: 'B1', topicOrder: 44, name: 'Indefinite Pronouns (Quelqu\'un, Personne)', frenchName: 'Pronoms indéfinis' },
  { id: 'b1-14', language: 'french', level: 'B1', topicOrder: 45, name: 'Interrogative Pronouns (Lequel, Duquel)', frenchName: 'Pronoms interrogatifs' },
  { id: 'b1-15', language: 'french', level: 'B1', topicOrder: 46, name: 'Adverbial Phrases', frenchName: 'Locutions adverbiales' },
  { id: 'b1-16', language: 'french', level: 'B1', topicOrder: 47, name: 'Agreement with Collective Nouns', frenchName: 'Accord avec les noms collectifs' },
  { id: 'b1-17', language: 'french', level: 'B1', topicOrder: 48, name: 'Indefinite Adjectives', frenchName: 'Adjectifs indéfinis' },

  // B2 Level (15 topics)
  { id: 'b2-01', language: 'french', level: 'B2', topicOrder: 49, name: 'Past Subjunctive', frenchName: 'Subjonctif passé' },
  { id: 'b2-02', language: 'french', level: 'B2', topicOrder: 50, name: 'Imperfect Subjunctive', frenchName: 'Subjonctif imparfait' },
  { id: 'b2-03', language: 'french', level: 'B2', topicOrder: 51, name: 'Pluperfect Subjunctive', frenchName: 'Subjonctif plus-que-parfait' },
  { id: 'b2-04', language: 'french', level: 'B2', topicOrder: 52, name: 'Conditional Perfect', frenchName: 'Conditionnel passé' },
  { id: 'b2-05', language: 'french', level: 'B2', topicOrder: 53, name: 'Future Perfect Tense', frenchName: 'Futur antérieur' },
  { id: 'b2-06', language: 'french', level: 'B2', topicOrder: 54, name: 'Narrative Tenses', frenchName: 'Temps narratifs' },
  { id: 'b2-07', language: 'french', level: 'B2', topicOrder: 55, name: 'Stylistic Inversion in Questions', frenchName: 'Inversion stylistique' },
  { id: 'b2-08', language: 'french', level: 'B2', topicOrder: 56, name: 'Pronominal Adverbs and Pronouns', frenchName: 'Adverbes et pronoms adverbiens' },
  { id: 'b2-09', language: 'french', level: 'B2', topicOrder: 57, name: 'Complex Relative Clauses', frenchName: 'Propositions relatives complexes' },
  { id: 'b2-10', language: 'french', level: 'B2', topicOrder: 58, name: 'Concessive Clauses (Bien que, Quoique)', frenchName: 'Propositions concessives' },
  { id: 'b2-11', language: 'french', level: 'B2', topicOrder: 59, name: 'Causal Clauses (Car, Parce que)', frenchName: 'Propositions causales' },
  { id: 'b2-12', language: 'french', level: 'B2', topicOrder: 60, name: 'Consecutive Clauses (Si bien que)', frenchName: 'Propositions consécutives' },
  { id: 'b2-13', language: 'french', level: 'B2', topicOrder: 61, name: 'Temporal Clauses (Quand, Lorsque)', frenchName: 'Propositions temporelles' },
  { id: 'b2-14', language: 'french', level: 'B2', topicOrder: 62, name: 'Advanced Passive Constructions', frenchName: 'Constructions passives avancées' },
  { id: 'b2-15', language: 'french', level: 'B2', topicOrder: 63, name: 'Register and Stylistic Variations', frenchName: 'Registre et variations stylistiques' },
];

// Helper functions
export function getTopicById(id: string): GrammarTopic | undefined {
  return grammarTopics.find(topic => topic.id === id);
}

export function getTopicsByLevel(level: 'A1' | 'A2' | 'B1' | 'B2'): GrammarTopic[] {
  return grammarTopics.filter(topic => topic.level === level);
}

export function getTotalTopics(): number {
  return grammarTopics.length;
}

export function getTopicByOrder(order: number): GrammarTopic | undefined {
  return grammarTopics.find(topic => topic.topicOrder === order);
}

export function getNextTopicAfter(currentTopicId: string): GrammarTopic {
  const currentTopic = getTopicById(currentTopicId);
  if (!currentTopic) {
    return grammarTopics[0]; // Default to first topic
  }

  const nextOrder = currentTopic.topicOrder + 1;
  const nextTopic = getTopicByOrder(nextOrder);

  return nextTopic || grammarTopics[0]; // Cycle back to first topic
}

export function getTopicsByIds(ids: string[]): GrammarTopic[] {
  return ids.map(id => getTopicById(id)).filter(Boolean) as GrammarTopic[];
}
