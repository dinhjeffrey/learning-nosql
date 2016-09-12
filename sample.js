// store aggregate pipeline operator in variable
var s1 = { $group: { _id: 'all', sum: { $sum: 1 } } };
db.s.aggregate(s1);

// sort via qty desc and asc
db.s.find().sort({ qty: -1 });
db.s.find().sort({ qty: 1 });

// $avg, $min, $max operators
var s1 = { $group: { _id: 'all', avg: { $avg: '$qty' } } };
var s1 = { $group: { _id: 'all', min: { $min: '$qty' } } };
var s1 = { $group: { _id: 'all', max: { $max: 'qty' } } };
var s1 = { $group: { _id: 'all', avg: { $avg: '$qty'}, min: { $min: '$qty'}, max: { $max: '$qty' } } };