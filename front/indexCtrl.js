app.controller('indexCtrl', function($scope, $http) {
	$scope.reverse = false;
	$scope.predicate = 'name';
	$scope.beerInspect = {};
	$scope.beerSelect = function(item) {
		$scope.beerInspect = item;
		$scope.getBeer(item.sku);
	};
	$scope.order = function(predicate) {
		$scope.reverse = ($scope.predicate === predicate) ? !$scope.reverse : false;
		$scope.predicate = predicate;
	};
	$http.get("http://localhost:3000/beer/all/")
	.success(function(response) {
		$scope.beers = response.result;
	});
	$scope.getBeer = function(sku) {
		$http.get("http://localhost:3000/beer/single/"+sku+"?key=sku")
		.success(function(response) {
			$scope.beerInspect = response.result;
		});
	};
})
