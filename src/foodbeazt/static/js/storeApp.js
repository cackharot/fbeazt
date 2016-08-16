var storeApp = angular.module('fbeaztAdmin')

storeApp.controller('storeListCtrl', function ($scope, $http) {
  $scope.stores = []

  $scope.reloadStore = function () {
    $http.get('/api/stores?page_size=200').success(function (d) {
      $scope.stores = d.items;
    }).error(function (e) {
      alert(e)
    })
  }

  $scope.reloadStore()

  $scope.deleteStore = function (id) {
    if (id && id != "-1") {
      $http.delete('/api/store/' + id).success(function (d) {
        $scope.reloadStore()
      }).error(function (e) {
        alert(e)
        $scope.reloadStore()
      })
    }
  }
})

storeApp.controller('storeDetailCtrl', function ($scope, $routeParams, $location, $http, FileUploader) {
  var id = $routeParams.id || -1;
  var uploader = $scope.uploader = new FileUploader()

  uploader.filters.push({
    name: 'imageFilter',
    fn: function (item /*{File|FileLikeObject}*/, options) {
      var type = '|' + item.type.slice(item.type.lastIndexOf('/') + 1) + '|';
      return '|jpg|png|jpeg|bmp|gif|'.indexOf(type) !== -1;
    }
  });

  uploader.onSuccessItem = function () {
    $location.path('/store')
  };
  uploader.onErrorItem = function (fileItem, response, status, headers) {
    console.info('onErrorItem', fileItem, response, status, headers)
  };


  $scope.model = {}
  $scope.food_types = [{ 'id': 'veg', 'text': 'Vegetarian' },
    { 'id': 'non-veg', 'text': 'Non-Vegetarian' }]

  $http.get('/api/store/' + id).success(function (d) {
    if (!d._id || !d._id.$oid)
      d._id = { "$oid": "-1" }
    $scope.model = d
  }).error(function (e) {
    alert('Error while fetching store details')
    $location.path('/store')
  })

  $scope.save = function () {
    if ($scope.frmStore.$invalid) {
      alert("Form contains invalid data\n\nPlease check the form and submit again")
      return
    }

    var item = angular.copy($scope.model)

    if (item._id.$oid == "-1") {
      item._id = null
      res = $http.post('/api/store/-1', item)
    } else {
      res = $http.put('/api/store/' + item._id.$oid, item)
    }

    res.success(
      function (data) {
        if (data.status == "success") {
          var store_id = data.data._id.$oid.toString() || $scope.model._id.$oid.toString()
          var url = '/api/upload_store_image/' + store_id
          uploader.url = url
          if (uploader.queue.length > 0) {
            uploader.queue[0].url = url
            uploader.queue[0].upload()
          } else {
            $location.path('/store')
          }
        } else {
          alert(data.message)
        }
      })
      .error(function (e) {
        alert(e)
        console.log(e)
      })
  }
})
