// Three curated example sentences that drive every stage of Module 01.
// Token IDs are REAL cl100k_base BPE ids (generated with js-tiktoken — see
// devDependencies); attention weights, next-token distributions and the
// continuation trees are hand-authored so that every stage is linguistically
// consistent and reads sensibly.

// 0..1 deterministic noise from two integers (embedding heat cells, filler weights)
export function noise(a, b) {
  const v = Math.sin((a + 1) * 37.7 + (b + 1) * 91.3) * 43758.5453
  return v - Math.floor(v)
}

export const EXAMPLES = [
  {
    id: 'cat',
    label: 'The classic',
    text: 'The cat sat on the',
    tokens: [
      { text: 'The', id: 791 },
      { text: ' cat', id: 8415 },
      { text: ' sat', id: 7731 },
      { text: ' on', id: 389 },
      { text: ' the', id: 279 },
    ],
    defaultQuery: 4,
    attn: {
      1: { 0: 0.5 },
      2: { 1: 0.55, 0: 0.15 },
      3: { 2: 0.55, 1: 0.12 },
      4: { 2: 0.4, 1: 0.28, 3: 0.16 },
    },
    attnNote: (
      'The final “the” pulls hardest on “sat” and “cat” — the verb and its subject. ' +
      'That blend is what lets the model know the next word should be a place a cat sits.'
    ),
    predictNote: (
      '“mat” dominates — not because of any rule, but because in the training data ' +
      'this exact pattern overwhelmingly continues that way. Every alternative is still scored.'
    ),
    tree: {
      _start: [['mat', 50], ['floor', 18], ['sofa', 13], ['windowsill', 10], ['keyboard', 9]],
      mat: [['.', 40], [',', 24], ['and', 20], ['all', 16]],
      floor: [['.', 38], [',', 26], ['and', 22], ['beside', 14]],
      sofa: [['.', 36], [',', 26], ['and', 22], ['cushion', 16]],
      windowsill: [['.', 40], [',', 28], ['watching', 32]],
      keyboard: [['.', 30], ['and', 26], ['deleting', 44]],
      ',': [['purring', 38], ['watching', 30], ['and', 32]],
      and: [['purred', 34], ['refused', 26], ['stared', 24], ['slept', 16]],
      all: [['day', 62], ['morning', 26], ['week', 12]],
      purring: [['softly', 46], ['loudly', 30], ['.', 24]],
      watching: [['the', 55], ['birds', 45]],
      purred: [['softly', 44], ['contentedly', 32], ['.', 24]],
      refused: [['to', 88], ['.', 12]],
      stared: [['at', 70], ['outside', 30]],
      slept: [['.', 60], ['soundly', 40]],
      soundly: [['.', 100]],
      softly: [['.', 100]],
      loudly: [['.', 100]],
      contentedly: [['.', 100]],
      day: [['.', 100]],
      morning: [['.', 100]],
      week: [['.', 100]],
      the: [['birds', 52], ['rain', 28], ['world', 20]],
      birds: [['.', 100]],
      rain: [['.', 100]],
      world: [['.', 100]],
      to: [['move', 58], ['budge', 42]],
      at: [['nothing', 55], ['everyone', 45]],
      beside: [['it', 100]],
      cushion: [['.', 100]],
      deleting: [['everything', 100]],
      outside: [['.', 100]],
      move: [['.', 100]], budge: [['.', 100]], nothing: [['.', 100]], everyone: [['.', 100]],
      it: [['.', 100]], everything: [['.', 100]],
    },
  },
  {
    id: 'robot',
    label: 'The pronoun puzzle',
    text: 'The robot picked up the ball because it was',
    tokens: [
      { text: 'The', id: 791 },
      { text: ' robot', id: 12585 },
      { text: ' picked', id: 13061 },
      { text: ' up', id: 709 },
      { text: ' the', id: 279 },
      { text: ' ball', id: 5041 },
      { text: ' because', id: 1606 },
      { text: ' it', id: 433 },
      { text: ' was', id: 574 },
    ],
    defaultQuery: 7,
    attn: {
      2: { 1: 0.5, 0: 0.12 },
      5: { 2: 0.35, 1: 0.2, 4: 0.12 },
      7: { 5: 0.55, 1: 0.2, 2: 0.07 },
      8: { 7: 0.45, 5: 0.2, 1: 0.1 },
    },
    attnNote: (
      '“it” resolves the pronoun through attention: 55% of its focus goes to “ball”, 20% to ' +
      '“robot”. No rule was programmed for this — the weights learned that things get picked up ' +
      'because they have a property. Click “was” to see the ambiguity carry forward.'
    ),
    predictNote: (
      'Look at the hedge: “heavy” treats “it” as the ball, “tired” treats “it” as the robot. The ' +
      'model keeps both readings alive and lets probability decide — this is attention’s pronoun ' +
      'resolution showing up in the prediction.'
    ),
    tree: {
      _start: [['heavy', 44], ['tired', 18], ['stuck', 14], ['red', 12], ['empty', 12]],
      heavy: [['.', 55], [',', 45]],
      tired: [['.', 60], [',', 40]],
      stuck: [['.', 100]],
      red: [['.', 60], ['and', 40]],
      empty: [['.', 100]],
      ',': [['so', 55], ['and', 45]],
      so: [['the', 100]],
      and: [['the', 100]],
      the: [['robot', 62], ['ball', 38]],
      robot: [['dropped', 55], ['struggled', 45]],
      ball: [['rolled', 60], ['slipped', 40]],
      dropped: [['it', 100]],
      struggled: [['.', 100]],
      rolled: [['away', 65], ['.', 35]],
      slipped: [['.', 100]],
      it: [['.', 100]],
      away: [['.', 100]],
    },
  },
  {
    id: 'tokens',
    label: 'The tokenomics one',
    text: 'Enterprise LLM bills are exploding because every request burns',
    tokens: [
      { text: 'Enterprise', id: 86747 },
      { text: ' L', id: 445 },
      { text: 'LM', id: 11237 },
      { text: ' bills', id: 19123 },
      { text: ' are', id: 527 },
      { text: ' exploding', id: 73745 },
      { text: ' because', id: 1606 },
      { text: ' every', id: 1475 },
      { text: ' request', id: 1715 },
      { text: ' burns', id: 44154 },
    ],
    defaultQuery: 9,
    attn: {
      3: { 0: 0.28, 1: 0.14, 2: 0.14 },
      5: { 3: 0.48, 4: 0.12 },
      8: { 7: 0.3, 3: 0.12 },
      9: { 8: 0.34, 5: 0.2, 3: 0.14 },
    },
    attnNote: (
      '“burns” looks back at “request” (its subject), “exploding” and “bills” — the whole causal ' +
      'chain of the sentence. Also notice the tokenizer split: “LLM” is two tokens, “ L” + “LM” — ' +
      'even the vocabulary has opinions about what counts as a word.'
    ),
    predictNote: (
      '“tokens” towers over the rest — the model has seen this pattern everywhere: requests burn ' +
      'tokens. The runners-up (“money”, “compute”) are the same idea one metaphor away.'
    ),
    tree: {
      _start: [['tokens', 57], ['money', 15], ['compute', 12], ['GPU', 9], ['cash', 7]],
      tokens: [[',', 45], ['.', 30], ['and', 25]],
      ',': [['and', 55], ['so', 45]],
      and: [['every', 100]],
      so: [['savings', 55], ['optimisation', 45]],
      savings: [['compound', 100]],
      compound: [['.', 100]],
      optimisation: [['pays', 100]],
      pays: [['.', 100]],
      every: [['token', 100]],
      token: [['costs', 100]],
      costs: [['money', 100]],
      money: [['.', 100]],
      compute: [['.', 100]],
      GPU: [['hours', 100]],
      hours: [['.', 100]],
      cash: [['.', 100]],
    },
  },
]

// Temperature reshapes a [word, weight] list into a normalized distribution.
export function applyTemp(opts, T) {
  const powed = opts.map(([t, p]) => [t, Math.pow(p / 100, 1 / T)])
  const sum = powed.reduce((a, [, p]) => a + p, 0)
  return powed.map(([t, p]) => [t, p / sum]).sort((a, b) => b[1] - a[1])
}
