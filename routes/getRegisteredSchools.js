const getRegisteredSchools = (app) => (
    // return (
        app.get('/api/registered_schools', async (req, res) => {
            try {
              const registeredSchools = await RegisterSchool.find()
                .lean()
                // .select('_id firstName lastName avatar bio');
          
              res.json({
                registeredSchools
              });
            } catch (err) {
              return res.status(400).json({
                message: 'There was a problem getting the registered schools'
              });
            }
        })
    // )
)

module.exports = { getRegisteredSchools }