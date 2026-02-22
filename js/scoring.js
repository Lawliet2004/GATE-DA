/* Scoring — GATE-style marking */
const Scoring = {
  calculate(questions, answers) {
    const settings = Storage.getSettings();
    const ms = settings.markingScheme;
    let score = 0, maxScore = 0, correct = 0, wrong = 0, skipped = 0;
    questions.forEach((q, i) => {
      const marks = q.type === 'MCQ' ? ms.mcqCorrect : q.type === 'MSQ' ? ms.msqCorrect : ms.natCorrect;
      maxScore += marks;
      const userAnswer = answers[i];
      if (userAnswer === undefined || (Array.isArray(userAnswer) && userAnswer.length === 0)) { skipped++; return; }
      if (q.type === 'NAT') {
        if (Math.abs(parseFloat(userAnswer) - parseFloat(q.correct)) < 0.01) { score += ms.natCorrect; correct++; }
        else { score += ms.natWrong; wrong++; }
      } else if (q.type === 'MSQ') {
        const correctSet = new Set(Array.isArray(q.correct) ? q.correct : [q.correct]);
        const userSet = new Set(Array.isArray(userAnswer) ? userAnswer : [userAnswer]);
        const allCorrect = [...correctSet].every(c => userSet.has(c)) && [...userSet].every(u => correctSet.has(u));
        if (allCorrect) { score += ms.msqCorrect; correct++; }
        else if (ms.msqPartial) {
          const hits = [...userSet].filter(u => correctSet.has(u)).length;
          const misses = [...userSet].filter(u => !correctSet.has(u)).length;
          if (misses === 0 && hits > 0) { score += (hits / correctSet.size) * ms.msqPartialValue; correct++; }
          else { score += ms.msqWrong; wrong++; }
        } else { score += ms.msqWrong; wrong++; }
      } else {
        if (userAnswer === q.correct) { score += ms.mcqCorrect; correct++; }
        else { score += ms.mcqWrong; wrong++; }
      }
    });
    return { score: Math.round(score * 100) / 100, maxScore, correct, wrong, skipped, total: questions.length };
  }
};
