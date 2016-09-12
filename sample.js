// Update
db.goo.update({ _id: 4 }, { $set: { x: 1 } });

// THE $GROUP PIPELINE OPERATOR
// aggregation is done in memory, server sided
// store aggregate pipeline operator in variable
var s1 = { $group: { _id: 'all', sum: { $sum: 1 } } };
db.s.insert({ sku: 'u1', qty: 20, price: 25 });
db.s.aggregate(s1);

// sort via qty desc and asc
db.s.find().sort({ qty: -1 });
db.s.find().sort({ qty: 1 });

// $avg, $min, $max operators
var s1 = { $group: { _id: 'all', avg: { $avg: '$qty' } } };
var s1 = { $group: { _id: 'all', min: { $min: '$qty' } } };
var s1 = { $group: { _id: 'all', max: { $max: 'qty' } } };
var s1 = { $group: { _id: 'all', avg: { $avg: '$qty' }, min: { $min: '$qty' }, max: { $max: '$qty' } } };

// group by field
var s1 = { $group: { _id: '$sku', sum: { $sum: 1 } } };

// $addToSet ensures the result array contains distinct members only once
// $push adds everything

// $first returns first document
// $last returns last document



// DOCUMENT SELECTION
db.s3.insert({ by: 'guy', tags: ['psych'], d: ISODate() });

// $match
// First, a bit on stateless vs. stateful. Stateful-ness and persistence in general can mean “the continuance of an effect after its cause is removed” meaning we care about what “has” happened and would like to access it later. Stateless on the other hand means that the “continuance of an effect” no longer matters and that whatever service is stateless doesn’t need to worry about retaining that information.
// $match operator has no state nor memory. It is stateless. It only evaluates documents that pass into it - pass it along or discard it. 
// $match evaluates document content and field values.
var s3 = { $match: { by: 'guy' } };

// compound
var s3 = { $sort: { by: 1, name: -1 } };

// $sort 
// - a greedy operator that must see all data before it works. use $match before $sort to limit
// $sort can't be used after $group, $project, $unwind operators because those operators create new documents. it has no index on the original documents.
var s3 = { $sort: { d: -1 } };

// $limit
// $limit is stateful.
// unlike $match, the $limit needs to keep track across documents. It needs an internal counter before it turns into a hard limiter - not letting anymore pass
// unlike $match, $limit does not evaluate document content and field values, just how many documents passed.
var s3 = { $limit: 4 };

// $skip
var s3 = { $skip: 1 };

// Paging. Multi-stage pipeline
var lim = { $limit: 2 };
var skp = { $skip: 2 };
db.s.aggregate(skp, lim);
skp.$skip = 4;

// SHAPING DOCUMENTS
// $group operator process things one thing at a time, can't do this with an array. So we need an intermediate transformation to set things up for the next pipeline operator.
db.s3.insert({ by: 'bob', name: 'sol', tags: ['scifi'], d: ISODate() });

// $unwind
// The unwind pipeline operator takes an input document and creates several documents as its output
// What is the opposite of $unwind? $group operators like $addToSet or $push
var s3q = { $unwind: '$tags' };

// $project
// We don't need every key (or column in sql), so we use $project
var s3q = { $project: { name: 1 } };
var s3q = { $project: { name: 1, _id: 0 } };

// Field Renaming
var s3q = { $project: { _id: 0, 'Book Title': '$name', 'Written By': '$by' } };

// Computation
// $add, $multiply are commutative so they can take more than 2 arguments
// $divide, $subtract, $mod take exactly 2 arguments
var s3q = { $project: { _id: 0, second: { $second: '$d' }, math: { $multiply: [{ $second: '$d' }, 1000] } } };

// String functions
// $concat, $substr
var s3q = { $project: { cited: { $concat: ['$name', ' - written by ', '$by'] } } };
var s3q = { $project: { by: 1, startswith: { $substr: ['$by', 0, 1] } } };

// Date functions
var s3q = {
    $project: {
        dayOfYear: { $dayOfYear: '$d' },
        dayOfMonth: { $dayOfMonth: '$d' },
        dayOfWeek: { $dayOfWeek: '$d' },
        year: { $year: '$d' },
        month: { $month: '$d' },
        week: { $week: '$d' },
        hour: { $hour: '$d' },
        minute: { $minute: '$d' },
        second: { $second: '$d' },
        millisecond: { $millisecond: '$d' },
        _id: 0,
        d: 1
    }
};

// Compound Conditional
var quarterCalculator = {
    $cond: [{ $gt: [{ $month: '$d' }, 9] }, 'Q4', {
        $cond: [{ $gt: [{ $month: '$d' }, 6] }, 'Q3', {
            $cond: [{ $gt: [{ $month: '$d' }, 3] }, 'Q2', 'Q1']
        }]
    }]
};
var s3q = { $project: { q: quarterCalculator, _id: 0, d: 1 } };

// $isNull
var s3q = { $project: { weight: { $ifNull: ['$weight', 1.0] } } };

// Building Blocks
var s3a = { $sort: { by: 1 } };
var s3b = { $project: { cited: { $concat: ['$name', ' - written by ', '$by'] } } };
db.s3.aggregate(s3a, s3b);

// Creating Sub-Documents
// No 'format' key (column in sql) prior
// use concat does a fake add, use update to really add format: 'eBook' to the document
var s3q = { $project: { format: { $concat: ['eBook'] } } };

// Multi-step Demo
// $project - expose quarter, year, and total
var s5a = {
    $project: {
        _id: 0,
        quarter: {
            $cond: [{ $gt: [{ $month: '$d' }, 9] }, 'Q4', {
                $cond: [{ $gt: [{ $month: '$d' }, 6] }, 'Q3', {
                    $cond: [{ $gt: [{ $month: '$d' }, 3] }, 'Q2', 'Q1']
                }]
            }]
        },
        year: {
            $year: '$date'
        },
        saleTotal: {
            $multiply: [
                '$product.price',
                '$product.quantity'
            ]
        }
    }
}
// $group - by quarter and year
var s5b = { $group: { _id: { q: '$quarter', y: '$year'}, total: { $sum: '$saleTotal'}, average: { $avg: '$saleTotal' } } };

// $sort - by year
var s5c = { $sort: { _id.y: 1 } };
db.sample5.aggregate(s5a, s5b, s5c)

// $group - by quarter only
var s5d = { $group: { _id: '$_id.q', years: { $push: { year: '$_id.y', QTotal: '$total', QAverage: '$average' }, totalY: { $sum: '$total' } } } };

// $project - for cosmetics
var s5e = { $project: { _id: 0, quarter: '$_id', years: 1, totalY: 1 } };

// OTHER OPERATORS

// Boolean Operators
// $and, $or, $not
// $and, $or are short circuit operators, when $and encounters false or $or encounters true, it stops evaluating and continues

// Comparison Operators
// { $eq: [ v1, v2 ] } (also $ne, $lt, $gt, $lte, $gte)
// { $cmp: [ v1, v2 ] } (returns -1, 0 , 1 for v1<2, v1=v2, v1>v2)

// Arithmetic Operators
// { $add: [ v1, v2, v3.. ] }
// { $multiply: [ v1, v2, v3.. ] }
// { $subtract: [ v1, v2 ] }
// { $divide: [ v1, v2 ] }
// { $mod: [ v1, v2 ] }

// String Operators
// { $toLower: str }
// { $toUpper: str }
// { $substr: [str, offset, count ] }
// { $substr: [ s1, s2, s3, ... ] }
// { $strcasecmp: [ s1, s2 ] } // Case inSenSiTive
// use $cmp for case-sensitive string compare

// Date Operators
// $year, $month, $week
// $dayOfYear, $dayOfMonth, $dayOfWeek
// $hour, $minute, $second, $millisecond

// Conditional Operators
// { $ifNull: [ expr, valueIfNull ] }
// { $cond: [ expr, valueIfTrue, valueIfFalse ] }

// MAP/REDUCE
// db.foo.mapReduce(myMap,myReduce,options)

// Map basics
function myMap() {
	emit(key,value); // 0 or more emits
}
function myMap() {
	var total = this.price + this.shipping;
	var cat = this.category.name;
	if (total>10) {emit(cat,total);}
}

// Reduce basics
// Want to make sure end result is same no matter where reduce value from from
// Values can come from 'beginning of tournament', or 'mid tournament'
// similar to map emit
function myReduce(key, values) {
	var reducedValue = Array.sum(values);
	return reducedValue;
}

// Finalize
// gets called only once per key with a final reduced value across all document for this key
function myFinalize(key, reducedValue) {
	return key + ' has ' + reducedValue;
}

// Demo
db.sam3.insert({ _id: 1, by: 'bob' } )
var m3 = function() {
	emit(this.by, 2);
};
var r3 = function(key, values) {
	return Array.sum(values);
};
var preview = { out: { inline: 1 } };

// DIGGING DEEPER IN MAP/REDUCE
