const BillingCycle = require('./billingCycle');

BillingCycle.methods(['get', 'post', 'put', 'delete']);
BillingCycle.updateOptions({ new: true, runValidators: true });

BillingCycle.route('count', function (req, res, next) {
    BillingCycle.count({}, function (err, value) {
        if (err) return res.status(500).json({ errors: [err] });
        return res.json({ value });
    });
});

BillingCycle.route('summary', (req, res, next) => {
    BillingCycle.aggregate([
        {
            $project: { credit: { $sum: "$credits.value" }, debt: { $sum: "$debts.value" } }
        }, {
            $group: { _id: null, credit: { $sum: "$credit" }, debt: { $sum: "$debt" } }
        }, {
            $project: { _id: 0, credit: 1, debt: 1 }
        }], (error, result) => {
            if (error) {
                res.status(500).json({ errors: [error] })
            } else {
                res.json(result[0] || { credit: 0, debt: 0 })
            }
        })
})


module.exports = BillingCycle;