const User = require('./User');
const School = require('./School');
const Class = require('./Class');
const Student = require('./Student');
const StudentGuardian = require('./StudentGuardian');
const StudentPickup = require('./StudentPickup');
const Parking = require('./Parking');
const ParkingSpot = require('./ParkingSpot');
const ParkingReservation = require('./ParkingReservation');
const Address = require('./Address');

// Associações User
User.hasMany(StudentGuardian, { foreignKey: 'user_id' });
User.hasMany(StudentPickup, { foreignKey: 'guardian_id' });
User.hasMany(ParkingReservation, { foreignKey: 'user_id' });

// Associações School
School.belongsTo(User, { foreignKey: 'responsible_user_id', as: 'responsible' });
School.hasMany(Class, { foreignKey: 'school_id' });
School.hasMany(Student, { foreignKey: 'school_id' });
School.hasMany(StudentPickup, { foreignKey: 'school_id' });
School.hasOne(Address, { foreignKey: 'school_id' });

// Associações Class
Class.belongsTo(School, { foreignKey: 'school_id' });
Class.hasMany(Student, { foreignKey: 'class_id' });

// Associações Student
Student.belongsTo(Class, { foreignKey: 'class_id' });
Student.belongsTo(School, { foreignKey: 'school_id' });
Student.belongsTo(User, { foreignKey: 'user_id', as: 'user_account' });
Student.hasMany(StudentGuardian, { foreignKey: 'student_id' });
Student.hasMany(StudentPickup, { foreignKey: 'student_id' });

// Associações StudentGuardian
StudentGuardian.belongsTo(Student, { foreignKey: 'student_id' });
StudentGuardian.belongsTo(User, { foreignKey: 'user_id' });

// Associações StudentPickup
StudentPickup.belongsTo(Student, { foreignKey: 'student_id' });
StudentPickup.belongsTo(User, { foreignKey: 'guardian_id', as: 'guardian' });
StudentPickup.belongsTo(School, { foreignKey: 'school_id' });
StudentPickup.belongsTo(User, { foreignKey: 'staff_id', as: 'staff' });

// Associações Parking
Parking.belongsTo(User, { foreignKey: 'owner_id', as: 'owner' });
Parking.hasMany(ParkingSpot, { foreignKey: 'parking_id' });
Parking.hasOne(Address, { foreignKey: 'parking_id' });
Parking.hasMany(ParkingReservation, { foreignKey: 'parking_id' });

// Associações ParkingSpot
ParkingSpot.belongsTo(Parking, { foreignKey: 'parking_id' });
ParkingSpot.hasMany(ParkingReservation, { foreignKey: 'spot_id' });

// Associações ParkingReservation
ParkingReservation.belongsTo(ParkingSpot, { foreignKey: 'spot_id' });
ParkingReservation.belongsTo(Parking, { foreignKey: 'parking_id' });
ParkingReservation.belongsTo(User, { foreignKey: 'user_id' });

// Associações Address
Address.belongsTo(User, { foreignKey: 'user_id' });
Address.belongsTo(School, { foreignKey: 'school_id' });
Address.belongsTo(Parking, { foreignKey: 'parking_id' });

module.exports = {
  User,
  School,
  Class,
  Student,
  StudentGuardian,
  StudentPickup,
  Parking,
  ParkingSpot,
  ParkingReservation,
  Address
};