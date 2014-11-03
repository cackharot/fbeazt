angular.module('fbFilters', [])
.filter('datetime', function() {
    return function(input) {
      if(input && input.$date){
        var d = new Date(input.$date);
        return d.toLocaleDateString()
      }
      return input
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
      var symbol = "<i class='fa fa-rupee'></i>"
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