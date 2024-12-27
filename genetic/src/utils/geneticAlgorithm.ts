import { Subject, Teacher, Class, Timetable, DAYS, PERIODS_PER_DAY } from '../types';

function generateInitialPopulation(classes: Class[], populationSize: number): Timetable[] {
  const population: Timetable[] = [];

  for (let i = 0; i < populationSize; i++) {
    const timetables = classes.map((cls) => ({
      classId: cls.id,
      slots: DAYS.flatMap((day) =>
        Array.from({ length: PERIODS_PER_DAY }, (_, period) => ({
          day,
          period,
          subjectId: cls.subjects[Math.floor(Math.random() * cls.subjects.length)],
          isLab: false,
        }))
      ),
    }));

    population.push(...timetables);
  }

  return population;
}

function calculateFitness(timetable: Timetable, classes: Class[], teachers: Teacher[], subjects: Subject[]): number {
  let fitness = 0;

  // Check for teacher conflicts
  const teacherSlots: { [teacherId: string]: Set<string> } = {};
  timetable.slots.forEach((slot) => {
    if (slot.subjectId) {
      const subject = subjects.find(s => s.id === slot.subjectId);
      if (subject) {
        const teacherId = subject.teacherId;
        if (!teacherSlots[teacherId]) {
          teacherSlots[teacherId] = new Set();
        }
        const slotKey = `${slot.day}-${slot.period}`;
        if (teacherSlots[teacherId].has(slotKey)) {
          fitness -= 10; // Penalize teacher conflicts
        } else {
          teacherSlots[teacherId].add(slotKey);
        }
      }
    }
  });

  // Check for continuous subjects
  let continuousSubjects = 0;
  for (let i = 1; i < timetable.slots.length; i++) {
    if (timetable.slots[i].subjectId === timetable.slots[i - 1].subjectId) {
      continuousSubjects++;
      if (continuousSubjects > 2) {
        fitness -= 5; // Penalize more than 2 continuous subjects
      }
    } else {
      continuousSubjects = 0;
    }
  }

  // Check for teacher constraints
  timetable.slots.forEach((slot) => {
    if (slot.subjectId) {
      const subject = subjects.find(s => s.id === slot.subjectId);
      if (subject) {
        const teacher = teachers.find((t) => t.id === subject.teacherId);
        if (teacher && teacher.constraints[slot.day]) {
          const { start, end } = teacher.constraints[slot.day]!;
          if (slot.period < start || slot.period > end) {
            fitness -= 10; // Penalize violating teacher constraints
          }
        }
      }
    }
  });

  // Check for subject constraints
  timetable.slots.forEach((slot) => {
    if (slot.subjectId) {
      const subject = subjects.find(s => s.id === slot.subjectId);
      if (subject && subject.constraints && subject.constraints[slot.day]) {
        const { start, end } = subject.constraints[slot.day]!;
        if (slot.period < start || slot.period > end) {
          fitness -= 10; // Penalize violating subject constraints
        }
      }
    }
  });

  // Check for lab sessions
  const classData = classes.find((c) => c.id === timetable.classId);
  if (classData) {
    classData.labs.forEach((lab) => {
      let labFound = false;
      for (let i = 0; i < timetable.slots.length - 1; i++) {
        if (
          timetable.slots[i].subjectId === lab.subjectId &&
          timetable.slots[i + 1].subjectId === lab.subjectId &&
          timetable.slots[i].day === timetable.slots[i + 1].day &&
          timetable.slots[i].period === timetable.slots[i + 1].period - 1
        ) {
          labFound = true;
          break;
        }
      }
      if (!labFound) {
        fitness -= 10; // Penalize missing lab sessions
      }
    });
  }

  return fitness;
}

function crossover(parent1: Timetable, parent2: Timetable): Timetable {
  const child: Timetable = {
    classId: parent1.classId,
    slots: [],
  };

  const crossoverPoint = Math.floor(Math.random() * parent1.slots.length);

  child.slots = [
    ...parent1.slots.slice(0, crossoverPoint),
    ...parent2.slots.slice(crossoverPoint),
  ];

  return child;
}

function mutate(timetable: Timetable, classes: Class[], mutationRate: number): Timetable {
  const mutatedTimetable: Timetable = {
    classId: timetable.classId,
    slots: timetable.slots.map((slot) => ({ ...slot })),
  };

  mutatedTimetable.slots.forEach((slot, index) => {
    if (Math.random() < mutationRate) {
      const classData = classes.find((c) => c.id === timetable.classId);
      if (classData) {
        slot.subjectId = classData.subjects[Math.floor(Math.random() * classData.subjects.length)];
      }
    }
  });

  return mutatedTimetable;
}

export function generateTimetables(
  classes: Class[],
  teachers: Teacher[],
  subjects: Subject[],
  populationSize: number = 100,
  generations: number = 100,
  mutationRate: number = 0.01
): Timetable[] {
  let population = generateInitialPopulation(classes, populationSize);

  for (let gen = 0; gen < generations; gen++) {
    const fitnessScores = population.map((timetable) => ({
      timetable,
      fitness: calculateFitness(timetable, classes, teachers, subjects),
    }));

    fitnessScores.sort((a, b) => b.fitness - a.fitness);

    const newPopulation: Timetable[] = [];

    // Elitism: Keep the best 10% of the population
    const eliteCount = Math.floor(populationSize * 0.1);
    newPopulation.push(...fitnessScores.slice(0, eliteCount).map((item) => item.timetable));

    // Generate the rest of the population through crossover and mutation
    while (newPopulation.length < populationSize) {
      const parent1 = fitnessScores[Math.floor(Math.random() * fitnessScores.length)].timetable;
      const parent2 = fitnessScores[Math.floor(Math.random() * fitnessScores.length)].timetable;

      let child = crossover(parent1, parent2);
      child = mutate(child, classes, mutationRate);

      newPopulation.push(child);
    }

    population = newPopulation;
  }

  // Return the best timetable for each class
  const bestTimetables: { [classId: string]: Timetable } = {};
  population.forEach((timetable) => {
    if (!bestTimetables[timetable.classId] || calculateFitness(timetable, classes, teachers, subjects) > calculateFitness(bestTimetables[timetable.classId], classes, teachers, subjects)) {
      bestTimetables[timetable.classId] = timetable;
    }
  });

  return Object.values(bestTimetables);
}

