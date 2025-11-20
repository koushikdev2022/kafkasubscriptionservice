import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
} from "typeorm";

@Entity("users")
export class User {
    @PrimaryGeneratedColumn({ type: "bigint", unsigned: true })
    id!: number;

    @Column({ type: "bigint", unsigned: true })
    user_id!: number;

    @Column({ type: "varchar", length: 255 })
    fullname!: string;

    @Column({ type: "varchar", length: 255, unique: true })
    @Index()
    username!: string;

    @Column({ type: "varchar", length: 255, unique: true })
    @Index()
    email!: string;

    @Column({ type: "varchar", length: 255, nullable: true })
    phone!: string | null;

    @Column({ type: "tinyint", default: 1 })
    is_active!: number;

    @CreateDateColumn({ type: "timestamp" })
    created_at!: Date;

    @UpdateDateColumn({ type: "timestamp" })
    updated_at!: Date;
}
