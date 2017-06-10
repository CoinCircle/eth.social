import PriorityQueue from '../src/index.js';
import assert from 'power-assert';
import { shuffle, range } from './util.js';

describe('basic Priority Queue features', () => {
  let randCaseSize = 3,
    caseSize = 100;
  let seqCase, randomCases, randomCasesAnswer, myObjectCase, myObjectCaseAnswer, myObjectComp;

  before(() => {
    seqCase = shuffle(range(caseSize));

    randomCases = new Array(randCaseSize);
    randomCasesAnswer = new Array(randCaseSize);
    for (let i = 0; i < randCaseSize; ++i) {
      randomCases[i] = [];
      for (let j = 0, c = 0; j < caseSize; ++j) {
        if (!c) randomCases[i].push(seqCase[j]); else {
          if (Math.random() < 0.5) {
            randomCases[i].push(seqCase[j--]);
            ++c;
          } else {
            randomCases[i].push('pop');
          }
        }
      }
      randomCasesAnswer[i] = [];
      let t = [];
      for(let item of randomCases[i]){
        if (item !== 'pop')
          t.push(item);
        else
          randomCasesAnswer[i].push(t.sort((a, b) => a - b).pop());
      }
    }

    myObjectCase = [];
    myObjectCaseAnswer = [];
    let xs = shuffle(range(caseSize)),
      ys = shuffle(range(caseSize));
    for (let i = 0; i < caseSize; ++i) {
      myObjectCase.push({
        x: xs[i],
        y: ys[i]
      });
      myObjectCaseAnswer.push({
        x: xs[i],
        y: ys[i]
      });
    }

    myObjectComp = (a, b) => a.x - b.x ? a.x - b.x : a.y - b.y;
    myObjectCaseAnswer.sort((a, b) => myObjectComp(a, b));
  });

  for (let strategy in PriorityQueue.strategies) {
    describe(PriorityQueue.strategies[strategy], () => {
      let pq;
      beforeEach(() => {
        pq = new PriorityQueue({
          strategy: parseInt(strategy)
        });
      });

      it('sequencial ' + caseSize + ' times push/pop', () => {

        for (let i = 0; i < caseSize; ++i) {
          pq.push(seqCase[i]);
        }
        for (let expected = caseSize - 1; expected >= 0; --expected) {
          const actual = pq.pop();
          assert(actual === expected);
        }
      });

      for (let randCase = 0; randCase < randCaseSize; ++randCase) {
        it('randomize ' + caseSize + ' times push/pop #' + (randCase + 1), () => {
          let popCount = 0;
          for (let i = 0; i < caseSize; ++i) {
            if (randomCases[randCase][i] !== 'pop')
              pq.push(randomCases[randCase][i]); else {
              const expected = randomCasesAnswer[randCase][popCount++],
                actual = pq.pop();
              assert(actual === expected);
            }
          }
        });
      }

      it('with user object', () => {
        let mpq = new PriorityQueue({
          strategy: parseInt(strategy),
          comparator: myObjectComp
        });

        for (let i = 0; i < caseSize; ++i) {
          mpq.push(myObjectCase[i]);
        }

        for (let i = caseSize - 1; i >= 0; --i) {
          const actual = mpq.pop(),
            expected = myObjectCaseAnswer[i];
          assert.deepEqual(actual, expected);
        }
      });
    });
  }
});
