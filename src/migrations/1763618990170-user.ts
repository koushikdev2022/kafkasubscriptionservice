import {
    MigrationInterface,
    QueryRunner,
    Table,
    TableIndex,
    TableForeignKey,
} from "typeorm";

export class User1763618990170 implements MigrationInterface {

   public async up(queryRunner: QueryRunner): Promise<void> {
        // Create users table
        await queryRunner.createTable(
            new Table({
                name: "users",
                columns: [
                    {
                        name: "id",
                        type: "bigint",
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: "increment",
                        unsigned: true,
                    },
                      {
                        name: "user_id",
                        type: "bigint",
                        unsigned: true,
                    },
                    {
                        name: "fullname",
                        type: "varchar",
                        length: "255",
                    },
                  
                    {
                        name: "username",
                        type: "varchar",
                        length: "255",
                        isUnique: true,
                    },
                    {
                        name: "email",
                        type: "varchar",
                        length: "255",
                        isUnique: true,
                    },
                    {
                        name: "phone",
                        type: "varchar",
                        length: "255",
                        isNullable: true,
                    },
                    {
                        name: "is_active",
                        type: "tinyint",
                        default: 1,
                    },
                    {
                        name: "created_at",
                        type: "timestamp",
                        default: "CURRENT_TIMESTAMP",
                    },
                    {
                        name: "updated_at",
                        type: "timestamp",
                        default: "CURRENT_TIMESTAMP",
                        onUpdate: "CURRENT_TIMESTAMP",
                    },
                ],
            }),
            true
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}
