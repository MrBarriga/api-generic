'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // Criação de todas as tabelas em ordem correta para evitar problemas de referência

        // 1. Criação da tabela de usuários
        await queryInterface.createTable('users', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true,
                allowNull: false,
            },
            name: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            email: {
                type: Sequelize.STRING,
                unique: true,
                allowNull: false,
            },
            phone_number: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            password: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            profile_photo: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            created_at: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.fn('NOW'),
                allowNull: false,
            },
            last_access: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            status: {
                type: Sequelize.ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED'),
                defaultValue: 'ACTIVE',
                allowNull: false,
            },
            user_type: {
                type: Sequelize.ENUM('ADMIN', 'SCHOOL', 'PARENT', 'STUDENT', 'PARKING_PROVIDER'),
                allowNull: false,
            },
            two_factor_token: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            preferences: {
                type: Sequelize.JSON,
                allowNull: true,
            },
            device_token: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            reset_password_token: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            reset_password_expires: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            refresh_token: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            refresh_token_expires: {
                type: Sequelize.DATE,
                allowNull: true,
            },
        });

        // 2. Criação da tabela de escolas
        await queryInterface.createTable('schools', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true,
                allowNull: false,
            },
            name: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            cnpj: {
                type: Sequelize.STRING,
                allowNull: true,
                unique: true,
            },
            phone_number: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            email: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            website: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            logo: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            operation_hours: {
                type: Sequelize.JSON,
                allowNull: true,
            },
            responsible_user_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT'
            },
            created_at: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.fn('NOW'),
                allowNull: false,
            },
            status: {
                type: Sequelize.ENUM('ACTIVE', 'INACTIVE', 'PENDING'),
                defaultValue: 'ACTIVE',
                allowNull: false,
            },
            settings: {
                type: Sequelize.JSON,
                allowNull: true,
            },
            plan: {
                type: Sequelize.ENUM('BASIC', 'PREMIUM', 'ENTERPRISE'),
                defaultValue: 'BASIC',
                allowNull: false,
            },
            notification_radius: {
                type: Sequelize.INTEGER,
                defaultValue: 500,
                allowNull: false,
            },
        });

        // 3. Criação da tabela de endereços
        await queryInterface.createTable('addresses', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true,
                allowNull: false,
            },
            user_id: {
                type: Sequelize.UUID,
                allowNull: true,
                references: {
                    model: 'users',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            school_id: {
                type: Sequelize.UUID,
                allowNull: true,
                references: {
                    model: 'schools',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            parking_id: {
                type: Sequelize.UUID,
                allowNull: true,
            },  // Será atualizado após criar a tabela de estacionamentos
            line1: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            line2: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            city: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            state: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            postal_code: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            country: {
                type: Sequelize.STRING,
                defaultValue: 'Brasil',
                allowNull: false,
            },
            latitude: {
                type: Sequelize.FLOAT,
                allowNull: true,
            },
            longitude: {
                type: Sequelize.FLOAT,
                allowNull: true,
            },
            address_type: {
                type: Sequelize.ENUM('RESIDENTIAL', 'COMMERCIAL', 'OTHER'),
                defaultValue: 'RESIDENTIAL',
                allowNull: false,
            },
            created_at: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.fn('NOW'),
                allowNull: false,
            },
            updated_at: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.fn('NOW'),
                allowNull: false,
            },
        });

        // 4. Criação da tabela de turmas
        await queryInterface.createTable('classes', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true,
                allowNull: false,
            },
            school_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'schools',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            name: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            level: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            year: {
                type: Sequelize.INTEGER,
                allowNull: true,
            },
            period: {
                type: Sequelize.ENUM('MORNING', 'AFTERNOON', 'FULL_TIME'),
                allowNull: false,
            },
            entry_time: {
                type: Sequelize.TIME,
                allowNull: true,
            },
            exit_time: {
                type: Sequelize.TIME,
                allowNull: true,
            },
            created_at: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.fn('NOW'),
                allowNull: false,
            },
        });

        // 5. Criação da tabela de alunos
        await queryInterface.createTable('students', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true,
                allowNull: false,
            },
            user_id: {
                type: Sequelize.UUID,
                allowNull: true,
                references: {
                    model: 'users',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            },
            name: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            birth_date: {
                type: Sequelize.DATEONLY,
                allowNull: true,
            },
            photo: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            class_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'classes',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT'
            },
            school_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'schools',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT'
            },
            exit_status: {
                type: Sequelize.ENUM('AT_SCHOOL', 'WAITING_EXIT', 'RELEASED', 'PICKED_UP'),
                defaultValue: 'AT_SCHOOL',
                allowNull: false,
            },
            special_needs: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            notes: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            created_at: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.fn('NOW'),
                allowNull: false,
            },
        });

        // 6. Criação da tabela de responsáveis de alunos
        await queryInterface.createTable('student_guardians', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true,
                allowNull: false,
            },
            student_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'students',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            user_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            relation: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            is_primary: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
                allowNull: false,
            },
            verified: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
                allowNull: false,
            },
            can_pickup: {
                type: Sequelize.BOOLEAN,
                defaultValue: true,
                allowNull: false,
            },
            start_date: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.fn('NOW'),
                allowNull: false,
            },
            end_date: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            created_at: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.fn('NOW'),
                allowNull: false,
            },
        });

        // 7. Criação da tabela de estacionamentos
        await queryInterface.createTable('parkings', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true,
                allowNull: false,
            },
            owner_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT'
            },
            name: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            type: {
                type: Sequelize.ENUM('COMMERCIAL', 'RESIDENTIAL', 'LAND'),
                allowNull: false,
            },
            description: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            rules: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            photos: {
                type: Sequelize.JSON,
                allowNull: true,
            },
            operation_hours: {
                type: Sequelize.JSON,
                allowNull: true,
            },
            latitude: {
                type: Sequelize.FLOAT,
                allowNull: true,
            },
            longitude: {
                type: Sequelize.FLOAT,
                allowNull: true,
            },
            status: {
                type: Sequelize.ENUM('ACTIVE', 'INACTIVE', 'PENDING_APPROVAL'),
                defaultValue: 'PENDING_APPROVAL',
                allowNull: false,
            },
            average_rating: {
                type: Sequelize.FLOAT,
                defaultValue: 0,
                allowNull: false,
            },
            total_ratings: {
                type: Sequelize.INTEGER,
                defaultValue: 0,
                allowNull: false,
            },
            created_at: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.fn('NOW'),
                allowNull: false,
            },
        });

        // Atualizar referência de parking_id na tabela de endereços
        await queryInterface.changeColumn('addresses', 'parking_id', {
            type: Sequelize.UUID,
            allowNull: true,
            references: {
                model: 'parkings',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
        });

        // 8. Criação da tabela de vagas de estacionamento
        await queryInterface.createTable('parking_spots', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true,
                allowNull: false,
            },
            parking_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'parkings',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            identifier: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            type: {
                type: Sequelize.ENUM('STANDARD', 'ACCESSIBLE', 'SENIOR', 'ELECTRIC', 'MOTORCYCLE'),
                defaultValue: 'STANDARD',
                allowNull: false,
            },
            dimensions: {
                type: Sequelize.JSON,
                allowNull: true,
            },
            price_minute: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: true,
            },
            price_hour: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false,
            },
            price_day: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: true,
            },
            price_month: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: true,
            },
            availability: {
                type: Sequelize.JSON,
                allowNull: true,
            },
            status: {
                type: Sequelize.ENUM('AVAILABLE', 'OCCUPIED', 'RESERVED', 'UNAVAILABLE', 'MAINTENANCE'),
                defaultValue: 'AVAILABLE',
                allowNull: false,
            },
            created_at: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.fn('NOW'),
                allowNull: false,
            },
        });

        // 9. Criação da tabela de retiradas de alunos
        await queryInterface.createTable('student_pickups', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true,
                allowNull: false,
            },
            student_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'students',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT'
            },
            guardian_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT'
            },
            school_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'schools',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT'
            },
            request_time: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.fn('NOW'),
                allowNull: false,
            },
            release_time: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            pickup_time: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            wait_time: {
                type: Sequelize.INTEGER,
                allowNull: true,
            },
            status: {
                type: Sequelize.ENUM('REQUESTED', 'RELEASED', 'COMPLETED', 'CANCELLED'),
                defaultValue: 'REQUESTED',
                allowNull: false,
            },
            latitude: {
                type: Sequelize.FLOAT,
                allowNull: true,
            },
            longitude: {
                type: Sequelize.FLOAT,
                allowNull: true,
            },
            staff_id: {
                type: Sequelize.UUID,
                allowNull: true,
                references: {
                    model: 'users',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            },
            confirmation_photos: {
                type: Sequelize.JSON,
                allowNull: true,
            },
            notes: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            created_at: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.fn('NOW'),
                allowNull: false,
            },
        });

        // 10. Criação da tabela de reservas de estacionamento
        await queryInterface.createTable('parking_reservations', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true,
                allowNull: false,
            },
            spot_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'parking_spots',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT'
            },
            parking_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'parkings',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT'
            },
            user_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT'
            },
            start_time: {
                type: Sequelize.DATE,
                allowNull: false,
            },
            end_time: {
                type: Sequelize.DATE,
                allowNull: false,
            },
            entry_time: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            exit_time: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            status: {
                type: Sequelize.ENUM('SCHEDULED', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'EXPIRED'),
                defaultValue: 'SCHEDULED',
                allowNull: false,
            },
            estimated_price: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false,
            },
            final_price: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: true,
            },
            payment_method: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            transaction_id: {
                type: Sequelize.UUID,
                allowNull: true,
            },
            notes: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            created_at: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.fn('NOW'),
                allowNull: false,
            },
        });

        // 11. Criação de índices para otimizar consultas

        // Índices para buscas por escola
        await queryInterface.addIndex('students', ['school_id']);
        await queryInterface.addIndex('classes', ['school_id']);
        await queryInterface.addIndex('student_pickups', ['school_id']);

        // Índices para busca de alunos por responsável
        await queryInterface.addIndex('student_guardians', ['user_id']);
        await queryInterface.addIndex('student_guardians', ['student_id', 'user_id']);

        // Índices para busca de reservas
        await queryInterface.addIndex('parking_reservations', ['user_id']);
        await queryInterface.addIndex('parking_reservations', ['parking_id']);
        await queryInterface.addIndex('parking_reservations', ['spot_id']);
        await queryInterface.addIndex('parking_reservations', ['status']);

        // Índices para busca de solicitações de retirada
        await queryInterface.addIndex('student_pickups', ['guardian_id']);
        await queryInterface.addIndex('student_pickups', ['student_id']);
        await queryInterface.addIndex('student_pickups', ['status']);

        // Índices para localização
        await queryInterface.addIndex('parkings', ['latitude', 'longitude']);
        await queryInterface.addIndex('addresses', ['latitude', 'longitude']);
    },

    down: async (queryInterface, Sequelize) => {
        // Remover tabelas na ordem inversa para evitar problemas com chaves estrangeiras
        await queryInterface.dropTable('parking_reservations');
        await queryInterface.dropTable('student_pickups');
        await queryInterface.dropTable('parking_spots');
        await queryInterface.dropTable('student_guardians');
        await queryInterface.dropTable('students');
        await queryInterface.dropTable('classes');
        await queryInterface.dropTable('addresses');
        await queryInterface.dropTable('parkings');
        await queryInterface.dropTable('schools');
        await queryInterface.dropTable('users');

        // Remover ENUM types
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_parking_reservations_status";');
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_student_pickups_status";');
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_parking_spots_status";');
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_parking_spots_type";');
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_parkings_status";');
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_parkings_type";');
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_students_exit_status";');
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_classes_period";');
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_addresses_address_type";');
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_schools_status";');
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_schools_plan";');
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_users_status";');
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_users_user_type";');
    }
};