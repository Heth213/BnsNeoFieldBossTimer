import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://wgwtxiryhaccadzbnise.supabase.co'; // paste supabase url here
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indnd3R4aXJ5aGFjY2FkemJuaXNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEyOTMyNTMsImV4cCI6MjA1Njg2OTI1M30.ft3HT-U8yrB3JVO6X2EHL1x_SHWvn_QKRkMgIW-G6Mo'; // paste supabase anon key here

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
