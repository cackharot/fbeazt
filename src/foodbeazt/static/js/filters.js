angular.module('fbFilters', [])
.filter('datetime', function() {
    return function(input) {
      if(input.$date){
        var d = new Date(input.$date);
        return d.toLocaleDateString()
      }
      return input
    }
})
.filter('show_food_type', function(){
    return function(input) {
      var veg = "<span class='fa-stack text-success'><i class='fa fa-square-o fa-stack-2x'></i><i class='fa fa-circle fa-stack-1x'></i></span>"
      var non_veg = "<span class='fa-stack text-danger'><i class='fa fa-square-o fa-stack-2x'></i><i class='fa fa-circle fa-stack-1x'></i></span>"

      if(input == 'non-veg'){
        return non_veg
      }else if(input != 'veg'){
        return veg + non_veg
      }
      return veg
    }
})