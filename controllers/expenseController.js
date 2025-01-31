const Expense = require('../models/expenseModel');
const User = require('../models/userModels');
const security = require('../utils/encryption');


const getUserExpenses = async (request, response) => {
    const { userId } = request.params;
    console.log('expense userId:', userId);

    try {
        const expenses = await Expense.findAll({
            where: { user_id: userId },
            include: { model: User, as: 'user', attributes: ['username', 'email'] },
            order: [['created_at', 'DESC']],
            logging: console.log,
        });

        response.status(200).json(expenses);
    } catch (error) {
        console.error('Error fetching expenses:', error);
        response.status(500).json({ message: 'Failed to fetch expenses' });
    }
};


const createExpense = async (request, response) => {
    const { user_id } = request.params
    const decryptedUserId = security.decrypt(user_id);
    console.log('Create Expense user_id:', request.params.user_id);

    const { amount, category, date_incurred, category_type, is_recurring } = request.body;

    try {
        const newExpense = await Expense.create({
            user_id: decryptedUserId,
            amount,
            category,
            date_incurred,
            category_type,
            is_recurring
        });

        response.status(201).json(newExpense);
    } catch (error) {
        console.error('Error creating expense:', error);
        response.status(500).json({ message: 'Failed to create expense' });
    }
};

const updateExpense = async (request, response) => {
    const { id } = request.params;
    const { amount, category, date_incurred, category_type, is_recurring } = request.body;

    try {
        const expense = await Expense.findByPk(id);

        if (!expense) {
            return response.status(404).json({ message: 'Expense not found' });
        }

        // Update fields
        expense.amount = amount ?? expense.amount;
        expense.category = category ?? expense.category;
        expense.date_incurred = date_incurred ?? expense.date_incurred;
        expense.category_type = category_type ?? expense.category_type;
        expense.is_recurring = is_recurring ?? expense.is_recurring;

        await expense.save();
        response.status(200).json(expense);
    } catch (error) {
        console.error('Error updating expense:', error);
        response.status(500).json({ message: 'Failed to update expense' });
    }
};

const deleteExpense = async (request, response) => {
    const { id } = request.params;

    try {
        const expense = await Expense.findByPk(id);

        if (!expense) {
            return response.status(404).json({ message: 'Expense not found' });
        }

        await expense.destroy(); 
        response.status(200).json({ message: 'Expense deleted successfully' });
    } catch (error) {
        console.error('Error deleting expense:', error);
        response.status(500).json({ message: 'Failed to delete expense' });
    }
};

module.exports = { getUserExpenses, createExpense, updateExpense, deleteExpense };
