import React, { useState } from "react";
import ClassInput from "./components/ClassInput";
import SubjectInput from "./components/SubjectInput";
import TeacherInput from "./components/TeacherInput";
import ExcelUpload from "./components/ExcelUpload";
import TimetableGenerator from "./components/TimetableGenerator";
import TimetableDisplay from "./components/TimetableDisplay";
import TeacherTimetableDisplay from "./components/TeacherTimetableDisplay";

function App() {
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [generatedTimetable, setGeneratedTimetable] = useState(null);
  const [activeTab, setActiveTab] = useState("student");

  const handleExcelData = (data) => {
    // Example parsing: assuming that the first row contains the headers,
    // and subsequent rows contain class, subject, and teacher data.
    const parsedClasses = [];
    const parsedSubjects = [];
    const parsedTeachers = [];

    data.forEach((row, index) => {
      if (index === 0) return; // Skip the header row

      const className = row[0];
      const subjectName = row[1];
      const teacherName = row[2];
      const creditHours = row[3]; // assuming credit hours are in the 4th column

      // Add to classes if not already added
      if (!parsedClasses.includes(className)) {
        parsedClasses.push(className);
      }

      // Add to subjects if not already added
      if (!parsedSubjects.some((subject) => subject.name === subjectName)) {
        parsedSubjects.push({ name: subjectName, creditHr: creditHours });
      }

      // Add to teachers
      if (!parsedTeachers.some((teacher) => teacher.name === teacherName)) {
        parsedTeachers.push({
          name: teacherName,
          assigned: [{ class: className, subject: { name: subjectName, creditHr: creditHours } }],
          constraints: [], // Initially no constraints
        });
      }
    });

    setClasses(parsedClasses);
    setSubjects(parsedSubjects);
    setTeachers(parsedTeachers);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-4xl font-bold text-center text-indigo-600 mb-12">
        Timetable Management System
      </h1>

      {/* Input forms for adding data */}
      <div className="flex flex-wrap justify-center mb-12 space-x-6 space-y-6">
        <ClassInput setClasses={setClasses} classes={classes} />
        <SubjectInput setSubjects={setSubjects} subjects={subjects} />
        <TeacherInput
          teachers={teachers}
          setTeachers={setTeachers}
          classes={classes}
          subjects={subjects}
        />
      </div>

      {/* Excel Upload */}
      <div className="flex justify-center mb-12">
        <ExcelUpload onFileUpload={handleExcelData} />
      </div>

      {/* Generate Timetable Button */}
      <div className="flex justify-center mb-8">
        <TimetableGenerator
          classes={classes}
          subjects={subjects}
          teachers={teachers}
          setGeneratedTimetable={setGeneratedTimetable}
        />
      </div>

      {/* Tab navigation */}
      {generatedTimetable && (
        <div className="mt-12">
          <div className="flex justify-center space-x-4 mb-6">
            <button
              onClick={() => handleTabChange("student")}
              className={`px-4 py-2 rounded-lg transition-colors duration-300 ${activeTab === "student"
                  ? "bg-indigo-500 text-white"
                  : "bg-gray-200 hover:bg-gray-300"
                }`}
            >
              Student POV
            </button>
            <button
              onClick={() => handleTabChange("teacher")}
              className={`px-4 py-2 rounded-lg transition-colors duration-300 ${activeTab === "teacher"
                  ? "bg-indigo-500 text-white"
                  : "bg-gray-200 hover:bg-gray-300"
                }`}
            >
              Teacher POV
            </button>
          </div>

          {/* Conditional rendering based on the selected tab */}
          <div className="mt-8">
            {activeTab === "student" && (
              <TimetableDisplay generatedTimetable={generatedTimetable} />
            )}
            {activeTab === "teacher" && (
              <TeacherTimetableDisplay
                generatedTimetable={generatedTimetable}
                teachers={teachers}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
