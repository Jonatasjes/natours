const Tour = require('./../models/tourModel')
const APIFeatures = require('./../utils/apiFeatures')

const catchAsync = require('./../utils/catchAsync')
const AppError = require('./../utils/appError')

exports.aliasTopTours = (req, res, next) => {
    req.query.limit = '5'
    req.query.sort = '-ratingsAverage,price'
    req.query.fields = 'name,price,ratingsAverage,summary,difficulty'
    next()
}

exports.getAllTours = catchAsync(async (req, res, next) => {

    const features = new APIFeatures(Tour.find(), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate()
        
    const tours = await features.query

    // Send response
    res.status(200).json({
        status: 'success',
        resultes: tours.length,
        data: {
            tours
        }
    })

    // try {
    //     // Execute query
        
    // } catch (err) {
    //     res.status(404).json({
    //         status: 'fail',
    //         message: err
    //     })
    // }
})


exports.getTour = catchAsync(async (req, res, next) => {
    
    const tour = await Tour.findById(req.params.id)

    if (!tour) {
        return next(new AppError('No tour found with that ID', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            tour
        }
    })


    // try {
        

    // } catch (err) {
    //     res.status(404).json({
    //         status: 'fail',
    //         message: err
    //     })
    // }
})

exports.createTour = catchAsync(async (req, res, next) => {

    console.log(req.body)
    const newTour = await Tour.create(req.body)
   
    res.status(201).json({
        status: 'success',
        data: {
            tour: newTour
        }
    })

    // try {
    //     // const newTour = new Tour({})
    //     // newTour.save()
  
    // } catch (err) {
    //     res.status(400).json({
    //         status: 'fail',
    //         message: 'Invalid data sent!'
    //     })
    // }
})

exports.updateTour = catchAsync(async (req, res, next) => {
    
    const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    })

    if (!tour) {
        return next(new AppError('No tour found with that ID', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            tour
        }
    })

    // try {
        
    // } catch (err) {
    //     res.status(404).json({
    //         status: 'fail',
    //         message: err
    //     })
    // }
    
})

exports.deleteTour = catchAsync(async (req, res, next) => {

    const tour = await Tour.findByIdAndDelete(req.params.id)

    if (!tour) {
        return next(new AppError('No tour found with that ID', 404));
    }

    res.status(204).json({
        status: 'success',
        data: null
    })

    // try {
        
    // } catch (err) {
    //     res.status(404).json({
    //         status: 'fail',
    //         message: err
    //     })
    // }
})

exports.getToursStats = catchAsync(async (req, res, next) => {

    const stats = await Tour.aggregate([
        {
            $match: { ratingsAverage: { $gte: 4.5 } }
        },
        {
            $group: { 
                _id:  { $toUpper: '$difficulty' },
                num: { $sum: 1 },
                numRationgs: { $sum: '$ratingsQuantity' },
                avgRating: { $avg: '$ratingsAverage' },
                avgPrice: { $avg: '$price' },
                minPrice: { $min: '$price' },
                maxPrice: { $max: '$price' },
            }
        },
        {
            $sort: {
                avgPrice: 1
            }
        },
        // {
        //     $match: {
        //         _id: { $ne: 'EASY' }
        //     }
        // }
    ])

    res.status(200).json({
        status: 'success',
        data: {
            stats
        }
    })

    // try {

    // } catch (err) {
    //     res.status(404).json({
    //         status: 'fail',
    //         message: err
    //     })
    // }
})

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {

    const year = req.params.year * 1

    const plan = await Tour.aggregate([
        {
            $unwind: '$startDates'
        },
        {
            $match: {
                startDates: {
                    $gte: new Date(`${year}-01-01`),
                    $lte: new Date(`${year}-12-01`)
                }
            }
        },
        {
            $group: {
                _id: { $month: '$startDates' },
                numTourStarts: { $sum: 1 },
                tours: { $push: '$name' }
            }
        },
        {
            $addFields: { month: '$_id' }
        },
        {
            $project: {
                _id: 0
            }
        },
        {
            $sort: { numTourStarts: -1 }
        },
        {
            $limit: 12
        }
    ])

    res.status(200).json({
        status: 'success',
        data: {
            plan
        }
    })

    // try {

    // } catch (err) {
    //     res.status(404).json({
    //         status: 'fail',
    //         message: err
    //     })
    // }
})