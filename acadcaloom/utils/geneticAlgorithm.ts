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
  const teacherSlots: { [teacher_id: string]: Set<string> } = {};
  timetable.slots.forEach((slot) => {
    if (slot.subject_id) {
      const subject = subjects.find(s => s.id === slot.subject_id);
      if (subject) {
        const teacher_id = subject.teacher_id; // Fixed: using snake_case
        if (!teacherSlots[teacher_id]) {
          teacherSlots[teacher_id] = new Set();
        }
        const slotKey = `${slot.day}-${slot.period}`;
        if (teacherSlots[teacher_id].has(slotKey)) {
          fitness -= 10; // Penalize teacher conflicts
        } else {
          teacherSlots[teacher_id].add(slotKey);
        }
      }
    }
  });

  // Check for continuous subjects
  let continuousSubjects = 0;
  for (let i = 1; i < timetable.slots.length; i++) {
    if (timetable.slots[i].subject_id === timetable.slots[i - 1].subject_id) {
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
    if (slot.subject_id) {
      const subject = subjects.find(s => s.id === slot.subject_id);
      if (subject) {
        const teacher = teachers.find((t) => t.id === subject.teacher_id); // Fixed: using snake_case
        if (teacher && teacher.constraints && teacher.constraints[slot.day]) {
          const constraint = teacher.constraints[slot.day];
          if (constraint) {
            const { start, end } = constraint;
            if (slot.period < start || slot.period > end) {
              fitness -= 10; // Penalize violating teacher constraints
            }
          }
        }
      }
    }
  });

  // Check for subject constraints
  timetable.slots.forEach((slot) => {
    if (slot.subject_id) {
      const subject = subjects.find(s => s.id === slot.subject_id);
      if (subject && subject.constraints && subject.constraints[slot.day]) {
        const constraint = subject.constraints[slot.day];
        if (constraint) {
          const { start, end } = constraint;
          if (slot.period < start || slot.period > end) {
            fitness -= 10; // Penalize violating subject constraints
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
    class_id: parent1.class_id,
    user_id: parent1.user_id,
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
    class_id: timetable.class_id,
    user_id: timetable.user_id,
    slots: timetable.slots.map((slot) => ({ ...slot })),
  };

  mutatedTimetable.slots.forEach((slot, index) => {
    if (Math.random() < mutationRate) {
      const classData = classes.find((c) => c.id === timetable.class_id);
      if (classData) {
        slot.subject_id = classData.subjects[Math.floor(Math.random() * classData.subjects.length)];
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