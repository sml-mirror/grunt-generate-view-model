import { Decorators } from '../../tasks/pipes/decorators';

const entityDecorators = [
    'Entity',
    'ViewEntity'
];

const columnDecorators = [
    'Column',
    'PrimaryColumn',
    'PrimaryGeneratedColumn',
    'ObjectIdColumn',
    'CreateDateColumn',
    'UpdateDateColumn',
    'DeleteDateColumn',
    'VersionColumn',
    'Generated',
];

const relationDecorators = [
    'OneToOne',
    'ManyToOne',
    'OneToMany',
    'ManyToMany',
    'JoinColumn',
    'JoinTable',
    'RelationId'
];

const listenerDecorators = [
    'AfterLoad',
    'BeforeInsert',
    'AfterInsert',
    'BeforeUpdate',
    'AfterUpdate',
    'BeforeRemove',
    'AfterRemove',
    'EventSubscriber'
];

const otherDecorators = [
    'Index',
    'Unique',
    'Check',
    'Exclusion',
    'Transaction',
    'TransactionManager',
    'TransactionRepository',
    'EntityRepository'
];

export const libDecorators = [
    Decorators.GenerateView,
    Decorators.IgnoreDecorators,
    Decorators.IgnoreViewModel,
    Decorators.ViewModelName,
    Decorators.ViewModelType
];

export const ignoreDecorators = [
    ...entityDecorators,
    ...columnDecorators,
    ...relationDecorators,
    ...listenerDecorators,
    ...otherDecorators,
    ...libDecorators,
];
