// scripts/fix-fleet-password.js
import 'dotenv/config'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import User from './models/User.js'

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI)
  const email = 'fleet@yourapp.com'
  const hash = await bcrypt.hash('qwerty123', 10)
  const u = await User.findOneAndUpdate(
    { email },
    { password: hash },
    { new: true }
  )
  console.log('Updated:', u?._id ?? 'not found')
  await mongoose.disconnect()
}
run().catch(e => { console.error(e); process.exit(1) })
