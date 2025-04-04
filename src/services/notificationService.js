const User = require('../models/User');
const School = require('../models/School');
const Student = require('../models/Student');
const StudentGuardian = require('../models/StudentGuardian');
const StudentPickup = require('../models/StudentPickup');
const ParkingReservation = require('../models/ParkingReservation');

/**
 * Enviar notificação push para um usuário
 */
async function sendPushNotification(userId, title, message, data = {}) {
    try {
        // Obter o device token do usuário
        const user = await User.findByPk(userId);
        if (!user || !user.device_token) {
            console.log(`Usuário ${userId} sem device token para notificação push`);
            return false;
        }

        // Aqui você implementaria a lógica para enviar a notificação usando
        // um serviço como Firebase Cloud Messaging, OneSignal, etc.
        console.log(`Enviando notificação push para ${userId}: ${title}`);

        // Exemplo com Firebase (você precisaria configurar o Firebase Admin SDK)
        // const admin = require('firebase-admin');
        // const message = {
        //   notification: {
        //     title,
        //     body: message
        //   },
        //   data,
        //   token: user.device_token
        // };
        // const response = await admin.messaging().send(message);
        // console.log('Notificação enviada:', response);

        return true;
    } catch (error) {
        console.error('Erro ao enviar notificação push:', error);
        return false;
    }
}

/**
 * Enviar notificação de proximidade de escola
 */
async function notifySchoolProximity(guardianId, schoolId, location) {
    try {
        // Verificar se o responsável tem alunos nesta escola
        const guardianStudents = await StudentGuardian.findAll({
            where: { user_id: guardianId },
            include: [
                {
                    model: Student,
                    where: { school_id: schoolId },
                    attributes: ['id', 'name']
                }
            ]
        });

        if (guardianStudents.length === 0) {
            return false; // Responsável não tem alunos nesta escola
        }

        // Obter a escola
        const school = await School.findByPk(schoolId);
        if (!school) {
            return false;
        }

        // Verificar preferências de notificação do usuário
        const guardian = await User.findByPk(guardianId);
        if (!guardian || !guardian.preferences?.notifications) {
            return false;
        }

        // Enviar notificação
        const studentNames = guardianStudents.map(gs => gs.Student.name).join(', ');
        await sendPushNotification(
            guardianId,
            'Chegando na escola',
            `Você está próximo da escola ${school.name}. Deseja solicitar a saída de ${studentNames}?`,
            {
                type: 'SCHOOL_PROXIMITY',
                school_id: schoolId,
                location: JSON.stringify(location),
                students: JSON.stringify(guardianStudents.map(gs => ({
                    id: gs.Student.id,
                    name: gs.Student.name
                })))
            }
        );

        return true;
    } catch (error) {
        console.error('Erro ao notificar proximidade de escola:', error);
        return false;
    }
}

/**
 * Notificar responsável sobre liberação de aluno
 */
async function notifyStudentRelease(pickupId) {
    try {
        // Obter detalhes da solicitação de retirada
        const pickup = await StudentPickup.findOne({
            where: { id: pickupId },
            include: [
                {
                    model: Student,
                    attributes: ['id', 'name']
                },
                {
                    model: School,
                    attributes: ['id', 'name']
                }
            ]
        });

        if (!pickup || pickup.status !== 'RELEASED') {
            return false;
        }

        // Enviar notificação para o responsável
        await sendPushNotification(
            pickup.guardian_id,
            'Aluno liberado para saída',
            `${pickup.Student.name} foi liberado para saída na escola ${pickup.School.name}.`,
            {
                type: 'STUDENT_RELEASED',
                pickup_id: pickupId,
                student_id: pickup.student_id,
                school_id: pickup.school_id
            }
        );

        return true;
    } catch (error) {
        console.error('Erro ao notificar liberação de aluno:', error);
        return false;
    }
}

/**
 * Notificar escola sobre solicitação de retirada
 */
async function notifyPickupRequest(pickupId) {
    try {
        // Obter detalhes da solicitação de retirada
        const pickup = await StudentPickup.findOne({
            where: { id: pickupId },
            include: [
                {
                    model: Student,
                    attributes: ['id', 'name']
                },
                {
                    model: User,
                    as: 'guardian',
                    attributes: ['id', 'name']
                }
            ]
        });

        if (!pickup || pickup.status !== 'REQUESTED') {
            return false;
        }

        // Obter funcionários da escola para notificar
        const schoolStaff = await User.findAll({
            where: {
                user_type: 'SCHOOL'
            },
            include: [
                {
                    model: School,
                    where: { id: pickup.school_id }
                }
            ]
        });

        // Enviar notificação para cada funcionário
        for (const staff of schoolStaff) {
            await sendPushNotification(
                staff.id,
                'Nova solicitação de retirada',
                `${pickup.User.name} solicitou a retirada de ${pickup.Student.name}.`,
                {
                    type: 'PICKUP_REQUESTED',
                    pickup_id: pickupId,
                    student_id: pickup.student_id,
                    guardian_id: pickup.guardian_id
                }
            );
        }

        return true;
    } catch (error) {
        console.error('Erro ao notificar solicitação de retirada:', error);
        return false;
    }
}

/**
 * Notificar proximidade de reserva de estacionamento
 */
async function notifyParkingReservationReminder(reservationId) {
    try {
        // Obter detalhes da reserva
        const reservation = await ParkingReservation.findOne({
            where: { id: reservationId },
            include: [
                {
                    model: Parking,
                    attributes: ['id', 'name']
                }
            ]
        });

        if (!reservation || reservation.status !== 'SCHEDULED') {
            return false;
        }

        // Verificar se está próximo do horário (1 hora antes)
        const now = new Date();
        const startTime = new Date(reservation.start_time);
        const timeDiff = (startTime - now) / (1000 * 60); // Diferença em minutos

        if (timeDiff > 60 || timeDiff < 0) {
            return false; // Não está no intervalo de lembrete (1 hora antes)
        }

        // Enviar notificação para o usuário
        await sendPushNotification(
            reservation.user_id,
            'Lembrete de reserva',
            `Sua reserva no estacionamento ${reservation.Parking.name} começa em aproximadamente 1 hora.`,
            {
                type: 'RESERVATION_REMINDER',
                reservation_id: reservationId,
                parking_id: reservation.parking_id,
                start_time: reservation.start_time
            }
        );

        return true;
    } catch (error) {
        console.error('Erro ao notificar lembrete de reserva:', error);
        return false;
    }
}

module.exports = {
    sendPushNotification,
    notifySchoolProximity,
    notifyStudentRelease,
    notifyPickupRequest,
    notifyParkingReservationReminder
};