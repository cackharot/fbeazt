angular.module('fbFilters', []).filter('datetime', function() {
    return function(input) {
      if(input.$date){
        var d = new Date(input.$date);
        return d.toLocaleDateString()
      }
      return input
    }
})