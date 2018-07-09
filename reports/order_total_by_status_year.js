db.getCollection('order_collection').aggregate([
    {'$project': {'status': "$status", 'total': "$total", 'year': {'$year': '$created_at'}}},
    {'$group': { count: { $sum: 1}, 'total': {'$sum': "$total"}, "year": { $first: "$year" }, "status": {$first:"$status"}, '_id': {'status': "$status", "year": "$year"}}}
])