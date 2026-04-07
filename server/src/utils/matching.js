// K-Means inspired clustering
export const assignCluster = (behavior, availability) => {
  const { frequencyTarget, studyWindow, commitment } = behavior;
  
  // Weekend Warrior: weekend availability dominant
  const weekendDays = availability?.filter(a => a.day === 'Saturday' || a.day === 'Sunday').length || 0;
  const weekdayDays = availability?.filter(a => a.day !== 'Saturday' && a.day !== 'Sunday').length || 0;
  
  if (weekendDays > weekdayDays && weekendDays >= 2) {
    return { label: 'Weekend Warrior', confidence: 85 };
  }
  
  if (commitment >= 8 && frequencyTarget >= 5) {
    return { label: 'Consistent Planner', confidence: 90 };
  } else if (studyWindow === 'night') {
    return { label: 'Night Owl', confidence: 87 };
  } else if (frequencyTarget <= 2 && commitment >= 7) {
    return { label: 'Sprint Learner', confidence: 82 };
  } else if (commitment <= 5) {
    return { label: 'Casual Learner', confidence: 75 };
  } else {
    return { label: 'Balanced Learner', confidence: 80 };
  }
};

// Calculate availability overlap percentage
const calculateOverlap = (avail1, avail2) => {
  if (!avail1?.length || !avail2?.length) return 0;

  const days1 = new Set(avail1.map(a => a.day));
  const days2 = new Set(avail2.map(a => a.day));
  const commonDays = [...days1].filter(d => days2.has(d));

  return (commonDays.length / 7) * 100;
};

// Convert skill level to numeric value
const skillToNumber = (skill) => {
  switch (skill?.toLowerCase()) {
    case 'beginner': return 1;
    case 'intermediate': return 2;
    case 'advanced': return 3;
    default: return 2;
  }
};

// Calculate skill balance score
const calculateSkillBalance = (skillA, skillB) => {
  const diff = Math.abs(skillToNumber(skillA) - skillToNumber(skillB));
  if (diff === 0) return 80;
  if (diff === 1) return 100;
  return 40; // diff >= 2
};

// Calculate similarity score
const calculateSimilarityScore = (user1, user2) => {
  // Cluster similarity
  const clusterSim = user1.cluster?.label === user2.cluster?.label ? 100 : 50;

  // Commitment similarity
  const commit1 = user1.behavior?.commitment || 5;
  const commit2 = user2.behavior?.commitment || 5;
  const commitSim = Math.max(0, 100 - Math.abs(commit1 - commit2) * 20);

  // Time similarity (study window)
  const time1 = user1.behavior?.studyWindow || 'morning';
  const time2 = user2.behavior?.studyWindow || 'morning';
  let timeSim = 30; // different
  if (time1 === time2) {
    timeSim = 100; // same
  } else if ((time1 === 'morning' && time2 === 'afternoon') ||
             (time1 === 'afternoon' && time2 === 'morning') ||
             (time1 === 'evening' && time2 === 'night') ||
             (time1 === 'night' && time2 === 'evening')) {
    timeSim = 60; // partial
  }

  return 0.4 * clusterSim + 0.3 * commitSim + 0.3 * timeSim;
};

// Generate reasons for match
const generateReasons = (overlapPct, clusterSim, skillDiff, commitSim) => {
  const reasons = [];

  if (overlapPct >= 40) {
    reasons.push(`${Math.round(overlapPct)}% schedule overlap`);
  }

  if (clusterSim === 100) {
    reasons.push('Same study pattern');
  }

  if (skillDiff === 0) {
    reasons.push('Same skill level');
  } else if (skillDiff === 1) {
    reasons.push('Complementary skill levels');
  }

  if (commitSim >= 80) {
    reasons.push('Similar commitment level');
  }

  if (reasons.length === 0) {
    reasons.push('Basic compatibility');
  }

  return reasons;
};

// Find top matches for a user using hybrid recommendation
export const findMatches = async (User, currentUser, subject, limit = 3) => {
  let query = {
    _id: { $ne: currentUser._id },
    onboardingComplete: true
  };

  // If subject is specified, filter by users who have that subject
  if (subject) {
    query['subjects.name'] = subject;
  }

  // Get all potential candidates
  const allCandidates = await User.find(query);

  // Filter candidates based on criteria
  const candidates = [];
  for (const candidate of allCandidates) {
    // Check schedule overlap >= 40%
    const overlapPct = calculateOverlap(currentUser.availability, candidate.availability);
    if (overlapPct < 40) continue;

    // Check if already in same group (simplified - in real app would check group memberships)
    // For now, we'll skip this check as it requires group data

    // Check if already invited (simplified - would need invite data)
    // For now, we'll skip this check

    candidates.push(candidate);
  }

  // Calculate scores for filtered candidates
  const scored = candidates.map(candidate => {
    const overlapPct = calculateOverlap(currentUser.availability, candidate.availability);

    let currentUserSubject, candidateSubject, subjectName;

    if (subject) {
      // Specific subject matching
      currentUserSubject = currentUser.subjects.find(s => s.name === subject);
      candidateSubject = candidate.subjects.find(s => s.name === subject);
      subjectName = subject;
    } else {
      // General matching - find best subject match
      const commonSubjects = currentUser.subjects?.filter(s1 =>
        candidate.subjects?.some(s2 => s2.name === s1.name)
      ) || [];

      if (commonSubjects.length > 0) {
        // Use first common subject
        subjectName = commonSubjects[0].name;
        currentUserSubject = currentUser.subjects.find(s => s.name === subjectName);
        candidateSubject = candidate.subjects.find(s => s.name === subjectName);
      } else {
        // No common subjects - use general criteria
        subjectName = 'General';
        currentUserSubject = currentUser.subjects?.[0];
        candidateSubject = candidate.subjects?.[0];
      }
    }

    // Calculate similarity score
    const similarityScore = calculateSimilarityScore(currentUser, candidate);

    // Calculate skill balance
    const skillBalance = calculateSkillBalance(
      currentUserSubject?.skill,
      candidateSubject?.skill
    );

    // Calculate final score
    const finalScore = 0.4 * overlapPct + 0.3 * skillBalance + 0.3 * similarityScore;

    // Generate reasons
    const clusterSim = currentUser.cluster?.label === candidate.cluster?.label ? 100 : 50;
    const commit1 = currentUser.behavior?.commitment || 5;
    const commit2 = candidate.behavior?.commitment || 5;
    const commitSim = Math.max(0, 100 - Math.abs(commit1 - commit2) * 20);
    const skillDiff = Math.abs(skillToNumber(currentUserSubject?.skill) - skillToNumber(candidateSubject?.skill));

    const reasons = generateReasons(overlapPct, clusterSim, skillDiff, commitSim);

    return {
      user: candidate,
      score: Math.round(finalScore),
      reasons,
      overlapPct: Math.round(overlapPct),
      skillLevel: candidateSubject?.skill || 'Intermediate',
      subject: subjectName,
      similarityScore: Math.round(similarityScore),
      skillBalance: skillBalance
    };
  });

  // Sort by final score desc, then by overlap desc
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.overlapPct !== a.overlapPct) return b.overlapPct - a.overlapPct;
    // Randomize ties
    return Math.random() - 0.5;
  });

  return scored.slice(0, limit);
};
