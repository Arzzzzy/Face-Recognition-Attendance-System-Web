# Face-Recognition-Attendance-System

** TITLE: Automated Attendance System with Facial Recognition**

ATTENDIFY - "Say goodbye to manual roll calls with advanced facial recognition technology for effortless attendance tracking."

**Description:**
  This repository contains the code and resources for a facial recognition system. This project is an automated attendance system that leverages facial recognition technology to streamline the process of marking attendance in a classroom setting. The primary objective is to improve the accuracy and efficiency of attendance tracking, reducing the manual effort required by instructors and minimizing the chances of errors or fraud.

  The API used is face-api.js from Vincent Muhler who is an Engineer from Germany. He built it on top of Tensoflow which is one of the most famous machine-learning libraries.

**Features:**
    - Course, Unit, and Venue Selection: Instructors can select the appropriate course, unit, and venue for which they want to take attendance. This ensures that the attendance data is accurately associated with the correct class session.
    - Photo Upload: Instructors can upload a class photo to assist with face recognition. The system processes this image to identify and recognize students.
    - Facial Recognition: Utilizing the face-api.js library, the system performs real-time face detection and recognition using the webcam feed or uploaded images. Detected faces are matched against a pre-labeled dataset to identify students.
    - Attendance Marking: Detected students' attendance is automatically marked and displayed in a table. Continuous detection ensures that students remain marked as present throughout the session.
    - Data Storage: Attendance data, including the student ID, course, unit, and attendance status, is saved to a database for future reference and reporting.

**Technologies Used:**
    - HTML/CSS/JavaScript: For the frontend interface.
    - PHP: For backend processing and database interactions.
    - MySQL: For storing course, unit, venue, and attendance data.
    - face-api.js: For facial recognition.
    
