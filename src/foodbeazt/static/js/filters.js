String.prototype.format = function() {
    var formatted = this;
    for (var i = 0; i < arguments.length; i++) {
        var regexp = new RegExp('\\{'+i+'\\}', 'gi');
        formatted = formatted.replace(regexp, arguments[i]);
    }
    return formatted;
};

angular.module('fbFilters', [])
.filter('datetime', function() {
    return function(input) {
      if(input && input.$date){
        var d = new Date(input.$date);
        return d.toLocaleDateString() +" "+ d.toLocaleTimeString();
      }
      return input;
    }
})
.filter('delivery_time', function() {
    return function(delivered_at, created_at) {
      if(delivered_at && delivered_at.$date){
        var d = new Date(delivered_at.$date);
        var c = new Date(created_at.$date);
        var diffInSec = Math.abs(d-c);
        var hrs = Math.floor(diffInSec/3600000);
        var mins = Math.floor((diffInSec%3600000)/60000);
        if(hrs <= 0){
          return "{0} mins".format(mins);
        }
        return "{0} hr{1} {2} min{3}".format(hrs,hrs>1?'s':'',mins,mins>1?'s':'');
      }
      return delivered_at;
    }
})
.filter('show_food_type', function(){
    return function(input) {
      var veg = "<span class='fa-stack fa-fw text-success'><i class='fa fa-square-o fa-fw fa-stack-1x'></i><i class='fa fa-dot-circle-o fa-fw fa-stack-1x'></i></span>"
      var non_veg = "<span class='fa-stack fa-fw text-danger'><i class='fa fa-square-o fa-fw fa-stack-1x'></i><i class='fa fa-dot-circle-o fa-fw fa-stack-1x'></i></span>"

      if(input == 'non-veg'){
        return non_veg
      }else if(input != 'veg'){
        return veg + non_veg
      }
      return veg
    }
})
.filter('currency', function(){
    return function(input) {
      var symbol = "&#8377;"
      return symbol + parseFloat(input).toFixed(2).toString()
    }
})
.filter('show_check_mark', function(){
    return function(input, compare_input) {
      var check_html = "<i class='fa fa-check'></i>"
      return input == compare_input ? check_html : ""
    }
})
.filter('default_product_img', function(){
    return function(input) {
      return input ? ('/static/images/products/' + input) : '/static/images/na-product.jpg'
    }
})
.filter('default_store_img', function(){
    return function(input) {
      return input ? ('/static/images/resturants/' + input) : '/static/images/na-resturant.jpg'
    }
})
