db.getCollection('order_collection').mapReduce(
function(){ 
    if(this.status === 'DELIVERED') {
        for(i=0; i < this.items.length; ++i) 
        { 
            var x = this.items[i];
            emit(x.store_id, {cnt: 1, qty: x.quantity, total: x.total }); 
        } 
    }
},
function(key,values) { 
    var rval = { cnt: 1, qty: 0, total: 0 };
    for(i=0; i < values.length; i++){
        rval.cnt += values[i].cnt;
        rval.qty += values[i].qty;
        rval.total += values[i].total;
    }
    return rval;
},
{
    out: "store_totals"
}
)