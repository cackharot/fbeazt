var smsApp = angular.module('fbeaztAdmin');

smsApp.controller('smsCtrl', function($scope,$http){
  $scope.messages = [];
  $scope.page_no = 1;
  $scope.page_size = 5;
  $scope.next = null;
  $scope.previous = null;
  $scope.load_url = '/api/sms';
  $scope.is_otp = true;

  $scope.load = function(){
    $http({
        url: $scope.load_url,
        method: 'GET',
        params: {"page_size": $scope.page_size, "is_otp": $scope.is_otp}
      })
      .success(function(d){
        $scope.messages = d.items;
        $scope.total = d.total;
        $scope.page_no = d.page_no;
        $scope.page_count = Math.ceil(d.total/$scope.page_size);
        $scope.next = d.next;
        $scope.previous = d.previous;
      })
      .error(function(e){
        alert(e);
      });
  };

  $scope.reset = function(){
    $scope.load_url = '/api/sms';
    $scope.next = null;
    $scope.previous = null;
    $scope.page_no = 1;
    $scope.page_size = 5;
    $scope.load();
  };

  $scope.navigate = function(url){
    $scope.load_url = url || '/api/sms';
    $scope.load();
    return false;
  };

  $scope.remove = function(_id){
    var  url = '/api/sms';
    $http({
        url: url,
        method: 'DELETE',
        params: {"_id":_id, "is_otp": $scope.is_otp}
      })
      .success(function(d){
        $scope.load();
      })
      .error(function(e){
        alert(e);
      });
  };

  $scope.load();
});
