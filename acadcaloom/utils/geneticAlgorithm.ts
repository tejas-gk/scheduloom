import { Subject, Teacher, Class, Timetable, TimeSlot, DAYS, PERIODS_PER_DAY, Room } from '../types';

function generateInitialPopulation(
  classes: Class[], 
  rooms: Room[],
  populationSize: number
): Timetable[] {
  const population: Timetable[] = [];

  for (let i = 0; i < populationSize; i++) {
    // Generate one timetable for each class
    classes.forEach((cls) => {
      const timetable: Timetable = {
        class_id: cls.id,
        user_id: '',
        slots: DAYS.flatMap((day) =>
          Array.from({ length: PERIODS_PER_DAY }, (_, period) => {
            const availableRooms = rooms.filter(room => {
              if (room.availability && room.availability[day]) {
                const { start, end } = room.availability[day]!;
                return period >= start && period <= end;
              }
              return true;
            });
            
            return {
              day,
              period,
              subject_id: cls.subjects[Math.floor(Math.random() * cls.subjects.length)],
              room_id: availableRooms[Math.floor(Math.random() * availableRooms.length)]?.id || null,
              is_lab: false,
              is_interval: false
            };
          })
        ),
      };
      population.push(timetable);
    });
  }

  return population;
}

function calculateFitness(
  timetable: Timetable, 
  classes: Class[], 
  teachers: Teacher[], 
  subjects: Subject[],
  rooms: Room[]
): number {
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

  // Check for lab sessions
  const labSlots: { [key: string]: string } = {};
  for (let i = 0; i < timetable.slots.length - 1; i++) {
    const slot = timetable.slots[i];
    const nextSlot = timetable.slots[i + 1];
    if (slot.isInterval || nextSlot.isInterval) continue;
    if (slot.isLab) {
      const labKey = `${slot.day}-${slot.period}`;
      if (labSlots[labKey]) {
        fitness -= 30; // Heavily penalize lab clashes between classes
      } else {
        labSlots[labKey] = timetable.classId;
      }

      if (slot.day === nextSlot.day && nextSlot.period === slot.period + 1 && slot.subjectId === nextSlot.subjectId && nextSlot.isLab) {
        fitness += 10; // Reward correct lab placement
      } else {
        fitness -= 15; // Penalize incorrect lab duration or placement
      }

      if (![0, 2, 4, 6].includes(slot.period)) {
        fitness -= 20; // Penalize incorrect lab start time
      }
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

  // Check for lab sessions
  const classData = classes.find((c) => c.id === timetable.class_id);
  if (classData && classData.labs) {
    classData.labs.forEach((lab) => {
      let labFound = false;
      for (let i = 0; i < timetable.slots.length - 1; i++) {
        if (
          timetable.slots[i].subject_id === lab.subject_id &&
          timetable.slots[i + 1].subject_id === lab.subject_id &&
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
  // Check for room conflicts
  const roomSlots: { [room_id: string]: Set<string> } = {};
  timetable.slots.forEach((slot) => {
    if (slot.room_id) {
      if (!roomSlots[slot.room_id]) {
        roomSlots[slot.room_id] = new Set();
      }
      const slotKey = `${slot.day}-${slot.period}`;
      if (roomSlots[slot.room_id].has(slotKey)) {
        fitness -= 15; // Heavy penalty for room conflicts
      } else {
        roomSlots[slot.room_id].add(slotKey);
      }
    }
  });

  // Check room type compatibility with subject
  timetable.slots.forEach((slot) => {
    if (slot.subject_id && slot.room_id) {
      const subject = subjects.find(s => s.id === slot.subject_id);
      const room = rooms.find(r => r.id === slot.room_id);
      
      if (subject && room) {
        // Penalize if lab subject is not in lab room
        if (slot.is_lab && room.type !== 'lab') {
          fitness -= 10;
        }
      }
    }
  });

  // Check room availability constraints
  timetable.slots.forEach((slot) => {
    if (slot.room_id) {
      const room = rooms.find(r => r.id === slot.room_id);
      if (room?.availability && room.availability[slot.day]) {
        const { start, end } = room.availability[slot.day]!;
        if (slot.period < start || slot.period > end) {
          fitness -= 8; // Penalize violating room availability
        }
      }
    }
  });

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
    if (slot.isInterval) return;
    if (Math.random() < mutationRate) {
      const classData = classes.find((c) => c.id === timetable.classId);
      if (classData) {
        const adjustedPeriod = slot.period > 5 ? slot.period - 2 : slot.period > 2 ? slot.period - 1 : slot.period;
        const isLab = Math.random() < 0.2 && (adjustedPeriod === 0 || adjustedPeriod === 2 || adjustedPeriod === 4 || adjustedPeriod === 6);
        slot.subjectId = isLab ? classData.labs[Math.floor(Math.random() * classData.labs.length)] : classData.subjects[Math.floor(Math.random() * classData.subjects.length)];
        slot.isLab = isLab;
        if (isLab && index < mutatedTimetable.slots.length - 1 && !mutatedTimetable.slots[index + 1].isInterval) {
          mutatedTimetable.slots[index + 1] = { ...slot, period: slot.period + 1 };
        }
      }
    }
  });

  return mutatedTimetable;
}

export function generateTimetables(
  classes: Class[],
  teachers: Teacher[],
  subjects: Subject[],
  rooms: Room[],
  populationSize: number = 100,
  generations: number = 100,
  mutationRate: number = 0.01
): Timetable[] {
  // Input validation
  if (!classes?.length || !teachers?.length || !subjects?.length || !rooms?.length) {
    throw new Error('Missing required input data');
  }

  let population = generateInitialPopulation(classes, rooms, populationSize);

  for (let gen = 0; gen < generations; gen++) {
    // Calculate fitness for each timetable
    const fitnessScores = population.map((timetable) => ({
      timetable,
      fitness: calculateFitness(timetable, classes, teachers, subjects, rooms)
    }));

    // Sort by fitness in descending order
    fitnessScores.sort((a, b) => b.fitness - a.fitness);

    const newPopulation: Timetable[] = [];

    // Elitism: Keep the best timetables for each class
    classes.forEach((cls) => {
      const bestForClass = fitnessScores
        .filter(item => item.timetable.class_id === cls.id)
        .slice(0, Math.max(1, Math.floor(populationSize * 0.1 / classes.length)));
      
      newPopulation.push(...bestForClass.map(item => item.timetable));
    });

    // Generate the rest of the population through crossover and mutation
    while (newPopulation.length < populationSize * classes.length) {
      // Select parents from the same class
      const targetClass = classes[Math.floor(newPopulation.length / populationSize) % classes.length];
      const classScores = fitnessScores.filter(item => item.timetable.class_id === targetClass.id);
      
      const parent1 = classScores[Math.floor(Math.random() * classScores.length)].timetable;
      const parent2 = classScores[Math.floor(Math.random() * classScores.length)].timetable;

      let child = crossover(parent1, parent2);
      child = mutate(child, classes, mutationRate);

      newPopulation.push(child);
    }

    population = newPopulation;
  }

  // Return the best timetable for each class
  const bestTimetables: { [class_id: string]: Timetable } = {};
  
  classes.forEach((cls) => {
    const classTimetables = population.filter(t => t.class_id === cls.id);
    const bestTimetable = classTimetables.reduce((best, current) => {
      const currentFitness = calculateFitness(current, classes, teachers, subjects, rooms);
      const bestFitness = calculateFitness(best, classes, teachers, subjects, rooms);
      return currentFitness > bestFitness ? current : best;
    }, classTimetables[0]);
    
    bestTimetables[cls.id] = bestTimetable;
  });

  return Object.values(bestTimetables);
}

