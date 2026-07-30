import React from 'react';
import { motion } from 'motion/react';
import { 
  Package, ArrowLeft, Sparkles, UserCircle, LogOut, Menu, X,
  BookOpen, Award, Users, ShoppingBag, Layers, Box
} from 'lucide-react';
import { sound } from '../../services/sound';
import { auth, signOut } from '../../services/firebase';

export type TabType = 'pack' | 'binder' | 'psa' | 'ripNship' | 'multiplayerLobby' | 'multiplayerArena' | 'cardShow' | 'missions' | 'auctions' | 'profile';

interface AppHeaderProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  currentUser: any;
  userProfile: any;
  setIsSetSelectorOpen: (open: boolean) => void;
  setIsLoginModalOpen: (open: boolean) => void;
  setIsBulkModalOpen: (open: boolean) => void;
  setIsInventoryOpen: (open: boolean) => void;
  earnedSetPacks: Array<{ count: number }>;
  ownedMysteryPacks: Array<{ count: number }>;
}

/**
 * AppHeader Component
 * 
 * Top Navigation Bar and responsive mobile menu drawer for Poke TCG app.
 */
export function AppHeader({
  activeTab,
  setActiveTab,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  currentUser,
  userProfile,
  setIsSetSelectorOpen,
  setIsLoginModalOpen,
  setIsBulkModalOpen,
  setIsInventoryOpen,
  earnedSetPacks,
  ownedMysteryPacks,
}: AppHeaderProps) {
  const totalPacksInInventory = 
    earnedSetPacks.reduce((s, p) => s + p.count, 0) + 
    ownedMysteryPacks.reduce((s, p) => s + p.count, 0);

  return (
    <header className="w-full py-2 px-2.5 sm:py-2.5 sm:px-5 flex flex-col lg:flex-row items-center justify-between gap-2.5 z-[60] relative border-b border-white/10 bg-[#14141c]/95 shadow-[0_10px_30px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(255,255,255,0.12)]">
      {/* Mobile Header Background Overlay */}
      <div className={`absolute inset-0 bg-[#14141c] z-[65] lg:hidden transition-opacity duration-300 pointer-events-none border-b border-white/10 ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0'}`} />

      {/* Logo & Desktop Primary Action */}
      <div className="flex w-full lg:w-auto justify-between lg:justify-start items-center relative z-[70] shrink-0 gap-3">
        <button
          onClick={() => { sound.playButtonClick(); setActiveTab('pack'); setIsMobileMenuOpen(false); }}
          className="text-amber-500 font-black tracking-widest text-base sm:text-lg flex items-center gap-2 shadow-amber-500/20 drop-shadow-md cursor-pointer hover:scale-105 transition-transform shrink-0"
        >
          <Package className="w-5 h-5 lg:w-5 lg:h-5 text-amber-400" />
          <span className="inline font-extrabold bg-gradient-to-r from-amber-400 via-amber-200 to-yellow-500 bg-clip-text text-transparent">POKE TCG</span>
        </button>

        <motion.button
          onClick={() => { sound.playModalOpen(); setIsSetSelectorOpen(true); setIsMobileMenuOpen(false); }}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          className="hidden lg:flex px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:via-yellow-300 hover:to-amber-400 text-black font-black text-xs shadow-[0_0_15px_rgba(245,158,11,0.5)] border border-yellow-200 hover:border-white items-center gap-1.5 cursor-pointer transition-all duration-300 group shrink-0 whitespace-nowrap"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-black font-black group-hover:-translate-x-0.5 transition-transform shrink-0" />
          <span className="tracking-wide uppercase font-black text-[11px]">PokeShop</span>
          <Sparkles className="w-3.5 h-3.5 text-black animate-pulse shrink-0" />
        </motion.button>

        {/* Mobile Header Top Profile Button & Menu Toggle */}
        <div className="flex lg:hidden items-center gap-2 relative z-[70]">
          {currentUser ? (
            <motion.button
              onClick={() => { sound.playTabSwitch(); setActiveTab('profile'); setIsMobileMenuOpen(false); }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 shadow-lg transition-all duration-300 cursor-pointer ${
                activeTab === 'profile'
                  ? 'bg-gradient-to-r from-fuchsia-600 via-purple-600 to-pink-600 border-fuchsia-300 text-white shadow-[0_0_20px_rgba(217,70,239,0.7)] animate-pulse'
                  : 'bg-gradient-to-r from-purple-950 via-fuchsia-900 to-pink-950 border-fuchsia-400/80 text-white shadow-[0_0_15px_rgba(192,38,211,0.5)] hover:border-fuchsia-300'
              }`}
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-fuchsia-400 via-pink-300 to-amber-300 flex items-center justify-center p-0.5 shadow-md shrink-0">
                <UserCircle className="w-6 h-6 text-black font-black" />
              </div>
              <div className="flex flex-col items-start leading-none min-w-0 pr-0.5">
                <span className="text-[8px] font-black uppercase tracking-wider text-fuchsia-300 flex items-center gap-1">
                  <span>TRAINER</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                </span>
                <span className="text-xs font-black text-white truncate max-w-[90px] sm:max-w-[120px] drop-shadow-md mt-0.5">
                  {currentUser.displayName || currentUser.email?.split('@')[0] || 'Profile'}
                </span>
              </div>
            </motion.button>
          ) : (
            <button
              onClick={() => { setIsLoginModalOpen(true); setIsMobileMenuOpen(false); }}
              className="px-3 py-1.5 rounded-xl border text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer bg-gradient-to-r from-purple-600 via-indigo-600 to-fuchsia-600 text-white border-fuchsia-400/60 shadow-[0_0_15px_rgba(168,85,247,0.5)] animate-pulse"
            >
              <UserCircle className="w-5 h-5 text-fuchsia-200 shrink-0" />
              <span className="text-xs font-black">Sign In</span>
            </button>
          )}

          <button
            onClick={() => { sound.playButtonClick(); setIsMobileMenuOpen(!isMobileMenuOpen); }}
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:text-white transition-colors relative z-[70]"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Navigation Container */}
      <div className={`
        fixed inset-0 z-[60] w-full h-[100dvh] bg-[#14141c]/98 p-6 flex flex-col gap-6 transform transition-all duration-300 ease-in-out pt-24 overflow-y-auto
        ${isMobileMenuOpen ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'}
        lg:static lg:w-auto lg:h-auto lg:flex-1 lg:bg-transparent lg:border-none lg:p-0 lg:flex-row lg:items-center lg:justify-between lg:translate-y-0 lg:pt-0 lg:flex lg:shadow-none lg:overflow-visible lg:gap-2 lg:transition-none lg:ml-2 lg:opacity-100 lg:pointer-events-auto
      `}>

        {/* Mobile PokeShop Button */}
        <div className="flex lg:hidden flex-col items-stretch gap-4 w-full shrink-0">
          <motion.button
            onClick={() => { sound.playModalOpen(); setIsSetSelectorOpen(true); setIsMobileMenuOpen(false); }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-4 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-black font-black text-sm shadow-[0_0_20px_rgba(245,158,11,0.6)] border border-yellow-200 flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4 text-black font-black" />
              <span className="tracking-wide uppercase font-black">PokeShop</span>
            </div>
            <Sparkles className="w-4 h-4 text-black animate-pulse" />
          </motion.button>
        </div>

        {/* Center Navigation Dock */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-1.5 lg:gap-0.5 w-full lg:w-auto lg:bg-[#0a0a0f]/80 lg:p-1 lg:rounded-xl lg:border lg:border-white/10 lg:shadow-[inset_0_1px_1px_rgba(255,255,255,0.08),0_4px_16px_rgba(0,0,0,0.6)] shrink-0 min-w-0">

          {/* Packs Tab */}
          <button
            onClick={() => { sound.playTabSwitch(); setActiveTab('pack'); setIsMobileMenuOpen(false); }}
            className={`relative group flex items-center justify-start lg:justify-center gap-2.5 lg:gap-1.5 px-4 py-3 lg:px-2.5 lg:py-1.5 xl:px-3 xl:py-1.5 rounded-xl lg:rounded-lg font-bold text-sm lg:text-[11px] xl:text-xs transition-all duration-200 whitespace-nowrap cursor-pointer ${activeTab === 'pack'
              ? 'bg-amber-500/15 lg:bg-white/15 text-white shadow-sm border border-amber-500/30 lg:border-white/20'
              : 'text-gray-400 hover:text-amber-300 hover:bg-white/5'
              }`}
          >
            <Package className={`w-4 h-4 lg:w-3.5 lg:h-3.5 xl:w-4 xl:h-4 transition-transform duration-300 group-hover:scale-110 ${activeTab === 'pack' ? 'text-amber-400' : 'text-gray-400 group-hover:text-amber-400'}`} />
            <span>Packs</span>
          </button>

          {/* Binder Tab */}
          <button
            onClick={() => { sound.playTabSwitch(); setActiveTab('binder'); setIsMobileMenuOpen(false); }}
            className={`relative group flex items-center justify-start lg:justify-center gap-2.5 lg:gap-1.5 px-4 py-3 lg:px-2.5 lg:py-1.5 xl:px-3 xl:py-1.5 rounded-xl lg:rounded-lg font-bold text-sm lg:text-[11px] xl:text-xs transition-all duration-200 whitespace-nowrap cursor-pointer ${activeTab === 'binder'
              ? 'bg-sky-500/15 lg:bg-white/15 text-white shadow-sm border border-sky-500/30 lg:border-white/20'
              : 'text-gray-400 hover:text-sky-300 hover:bg-white/5'
              }`}
          >
            <BookOpen className={`w-4 h-4 lg:w-3.5 lg:h-3.5 xl:w-4 xl:h-4 transition-transform duration-300 group-hover:-translate-y-0.5 ${activeTab === 'binder' ? 'text-sky-400' : 'text-gray-400 group-hover:text-sky-400'}`} />
            <span>Binder</span>
          </button>

          {/* PSA Tab */}
          <button
            onClick={() => { sound.playTabSwitch(); setActiveTab('psa'); setIsMobileMenuOpen(false); }}
            className={`relative group flex items-center justify-start lg:justify-center gap-2.5 lg:gap-1.5 px-4 py-3 lg:px-2.5 lg:py-1.5 xl:px-3 xl:py-1.5 rounded-xl lg:rounded-lg font-bold text-sm lg:text-[11px] xl:text-xs transition-all duration-200 whitespace-nowrap cursor-pointer ${activeTab === 'psa'
              ? 'bg-rose-500/15 lg:bg-white/15 text-white shadow-sm border border-rose-500/30 lg:border-white/20'
              : 'text-gray-400 hover:text-rose-300 hover:bg-white/5'
              }`}
          >
            <Award className={`w-4 h-4 lg:w-3.5 lg:h-3.5 xl:w-4 xl:h-4 transition-transform duration-300 group-hover:scale-110 ${activeTab === 'psa' ? 'text-rose-400' : 'text-gray-400 group-hover:text-rose-400'}`} />
            <span>PSA Lab</span>
          </button>

          {/* Multiplayer Tab */}
          <button
            onClick={() => { sound.playTabSwitch(); setActiveTab('multiplayerLobby'); setIsMobileMenuOpen(false); }}
            className={`relative group flex items-center justify-start lg:justify-center gap-2.5 lg:gap-1.5 px-4 py-3 lg:px-2.5 lg:py-1.5 xl:px-3 xl:py-1.5 rounded-xl lg:rounded-lg font-bold text-sm lg:text-[11px] xl:text-xs transition-all duration-200 whitespace-nowrap cursor-pointer ${(activeTab === 'multiplayerLobby' || activeTab === 'multiplayerArena')
              ? 'bg-purple-500/15 lg:bg-white/15 text-white shadow-sm border border-purple-500/30 lg:border-white/20'
              : 'text-gray-400 hover:text-purple-300 hover:bg-white/5'
              }`}
          >
            <Users className={`w-4 h-4 lg:w-3.5 lg:h-3.5 xl:w-4 xl:h-4 transition-transform duration-300 group-hover:scale-105 ${(activeTab === 'multiplayerLobby' || activeTab === 'multiplayerArena') ? 'text-purple-400' : 'text-gray-400 group-hover:text-purple-400'}`} />
            <span>Versus</span>
          </button>

          {/* Card Show Tab */}
          <button
            onClick={() => { sound.playTabSwitch(); setActiveTab('cardShow'); setIsMobileMenuOpen(false); }}
            className={`relative group flex items-center justify-start lg:justify-center gap-2.5 lg:gap-1.5 px-4 py-3 lg:px-2.5 lg:py-1.5 xl:px-3 xl:py-1.5 rounded-xl lg:rounded-lg font-bold text-sm lg:text-[11px] xl:text-xs transition-all duration-200 whitespace-nowrap cursor-pointer ${activeTab === 'cardShow'
              ? 'bg-teal-500/15 lg:bg-white/15 text-white shadow-sm border border-teal-500/30 lg:border-white/20'
              : 'text-gray-400 hover:text-teal-300 hover:bg-white/5'
              }`}
          >
            <ShoppingBag className={`w-4 h-4 lg:w-3.5 lg:h-3.5 xl:w-4 xl:h-4 transition-transform duration-300 group-hover:scale-110 ${activeTab === 'cardShow' ? 'text-teal-400' : 'text-gray-400 group-hover:text-teal-400'}`} />
            <span>Card Show</span>
          </button>

          {/* Auctions Tab */}
          <button
            onClick={() => { sound.playTabSwitch(); setActiveTab('auctions'); setIsMobileMenuOpen(false); }}
            className={`relative group flex items-center justify-start lg:justify-center gap-2.5 lg:gap-1.5 px-4 py-3 lg:px-2.5 lg:py-1.5 xl:px-3 xl:py-1.5 rounded-xl lg:rounded-lg font-bold text-sm lg:text-[11px] xl:text-xs transition-all duration-200 whitespace-nowrap cursor-pointer ${activeTab === 'auctions'
              ? 'bg-red-500/15 lg:bg-white/15 text-white shadow-sm border border-red-500/30 lg:border-white/20'
              : 'text-gray-400 hover:text-red-300 hover:bg-white/5'
              }`}
          >
            <div className={`w-2 h-2 rounded-full shrink-0 ${activeTab === 'auctions' ? 'bg-red-500 animate-pulse shadow-[0_0_8px_#ef4444]' : 'bg-red-500/60 group-hover:bg-red-400'}`} />
            <span className={activeTab === 'auctions' ? 'text-red-400 font-extrabold' : ''}>Auctions</span>
          </button>

          {/* RipNship Tab */}
          <button
            onClick={() => { sound.playTabSwitch(); setActiveTab('ripNship'); setIsMobileMenuOpen(false); }}
            className={`relative group flex items-center justify-start lg:justify-center gap-2.5 lg:gap-1.5 px-3.5 py-2.5 lg:px-2.5 lg:py-1.5 xl:px-3 xl:py-1.5 rounded-xl lg:rounded-lg font-black text-sm lg:text-[11px] xl:text-xs transition-all duration-200 whitespace-nowrap cursor-pointer ${activeTab === 'ripNship'
              ? 'bg-gradient-to-r from-red-600 via-rose-600 to-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)] border border-red-400'
              : 'text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/30'
              }`}
          >
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_#ef4444] shrink-0" />
            <span className="font-black">RipNship</span>
          </button>

          {/* Vault Tab */}
          <button
            onClick={() => { sound.playTabSwitch(); setIsBulkModalOpen(true); setIsMobileMenuOpen(false); }}
            className="relative group flex items-center justify-start lg:justify-center gap-2.5 lg:gap-1.5 px-4 py-3 lg:px-2.5 lg:py-1.5 xl:px-3 xl:py-1.5 rounded-xl lg:rounded-lg font-bold text-sm lg:text-[11px] xl:text-xs transition-all duration-200 whitespace-nowrap cursor-pointer text-gray-400 hover:text-cyan-300 hover:bg-white/5"
          >
            <Layers className="w-4 h-4 lg:w-3.5 lg:h-3.5 xl:w-4 xl:h-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:text-cyan-400 text-gray-400" />
            <span>Vault</span>
          </button>

          {/* Inventory Tab */}
          <button
            onClick={() => { sound.playTabSwitch(); setIsInventoryOpen(true); setIsMobileMenuOpen(false); }}
            className="relative group flex items-center justify-start lg:justify-center gap-2.5 lg:gap-1.5 px-4 py-3 lg:px-2.5 lg:py-1.5 xl:px-3 xl:py-1.5 rounded-xl lg:rounded-lg font-extrabold text-sm lg:text-[11px] xl:text-xs transition-all duration-200 whitespace-nowrap cursor-pointer text-amber-300 hover:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-400/50 shadow-[0_0_10px_rgba(245,158,11,0.2)]"
          >
            <Box className="w-4 h-4 lg:w-3.5 lg:h-3.5 xl:w-4 xl:h-4 text-amber-400 transition-transform duration-300 group-hover:scale-110 shrink-0" />
            <span>Inventory</span>
            {totalPacksInInventory > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-black text-[9px] font-black font-mono shadow animate-pulse shrink-0">
                {totalPacksInInventory}
              </span>
            )}
          </button>
        </div>

        {/* Right Utility Navigation */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2 lg:gap-1.5 w-full lg:w-auto mt-2 lg:mt-0 shrink-0">
          {/* Mobile Profile Card */}
          {currentUser ? (
            <div className="flex lg:hidden flex-col gap-2 w-full my-1">
              <motion.button
                onClick={() => { sound.playTabSwitch(); setActiveTab('profile'); setIsMobileMenuOpen(false); }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full p-4 rounded-2xl border flex items-center justify-between shadow-2xl transition-all duration-300 cursor-pointer relative overflow-hidden group ${
                  activeTab === 'profile'
                    ? 'bg-gradient-to-r from-fuchsia-600 via-purple-600 to-pink-600 border-fuchsia-300 text-white shadow-[0_0_30px_rgba(217,70,239,0.7)]'
                    : 'bg-gradient-to-r from-purple-950/90 via-fuchsia-950/90 to-pink-950/90 border-fuchsia-400/80 hover:border-fuchsia-300 text-white shadow-[0_0_25px_rgba(192,38,211,0.5)]'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-fuchsia-400 via-pink-400 to-amber-300 flex items-center justify-center p-0.5 shadow-lg border border-white/30 shrink-0 overflow-hidden">
                    {(userProfile?.avatarUrl || currentUser?.photoURL) ? (
                      <img src={userProfile?.avatarUrl || currentUser?.photoURL} alt="Avatar" className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      <UserCircle className="w-10 h-10 text-black font-black" />
                    )}
                  </div>
                  <div className="flex flex-col items-start leading-tight min-w-0 text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-fuchsia-300 bg-fuchsia-950/90 px-2 py-0.5 rounded-full border border-fuchsia-500/50">
                        TRAINER PROFILE
                      </span>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    </div>
                    <span className="text-base font-black text-white truncate max-w-[180px] sm:max-w-[240px] drop-shadow-md mt-1">
                      {userProfile?.displayName || currentUser.displayName || currentUser.email?.split('@')[0] || 'My Profile'}
                    </span>
                    <span className="text-xs text-gray-300 truncate max-w-[180px] font-medium opacity-90">
                      {currentUser.email}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-3 py-1.5 rounded-xl bg-white/20 border border-white/30 text-white font-extrabold text-xs flex items-center gap-1 shadow-md">
                    <span>View</span>
                    <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); signOut(auth); setIsMobileMenuOpen(false); }}
                    className="p-2.5 rounded-xl bg-red-600/30 border border-red-400/50 text-red-300 hover:bg-red-600/50 transition-colors shadow-md"
                    title="Sign Out"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </motion.button>
            </div>
          ) : (
            <div className="flex lg:hidden flex-col gap-2 w-full my-1">
              <button
                onClick={() => { setIsLoginModalOpen(true); setIsMobileMenuOpen(false); }}
                className="w-full p-4 rounded-2xl border flex items-center justify-between shadow-2xl transition-all cursor-pointer bg-gradient-to-r from-purple-600 via-indigo-600 to-fuchsia-600 text-white border-fuchsia-400/70 shadow-[0_0_25px_rgba(168,85,247,0.5)] animate-pulse"
              >
                <div className="flex items-center gap-3">
                  <UserCircle className="w-8 h-8 text-fuchsia-200 shrink-0" />
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-black text-white uppercase tracking-wider">Sign In / Register</span>
                    <span className="text-xs text-purple-200 font-medium">Save binders & sync cards to cloud</span>
                  </div>
                </div>
                <Sparkles className="w-5 h-5 text-amber-300" />
              </button>
            </div>
          )}

          {/* Desktop Compact Profile Utilities */}
          <div className="hidden lg:flex items-center gap-1.5 w-auto">
            {currentUser ? (
              <div className="flex items-center gap-1.5 w-auto">
                <button
                  onClick={() => { sound.playTabSwitch(); setActiveTab('profile'); setIsMobileMenuOpen(false); }}
                  className={`p-2 lg:p-1.5 rounded-lg border text-xs font-bold transition-all flex items-center justify-center cursor-pointer shrink-0 bg-white/5 lg:bg-transparent border-white/10 lg:border-white/5 hover:bg-fuchsia-500/10 hover:text-fuchsia-300 hover:border-fuchsia-500/30 ${activeTab === 'profile' ? 'text-fuchsia-300 border-fuchsia-500/30 bg-fuchsia-500/10' : 'text-gray-300'}`}
                  title={currentUser.email || "Profile"}
                >
                  <UserCircle className="w-4 h-4 lg:w-4 lg:h-4 shrink-0" />
                </button>
                <button
                  onClick={() => { signOut(auth); setIsMobileMenuOpen(false); }}
                  className="p-2 lg:p-1.5 rounded-lg border text-xs font-bold transition-all flex items-center justify-center cursor-pointer shrink-0 bg-white/5 lg:bg-transparent border-white/10 lg:border-white/5 text-gray-300 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4 lg:w-4 lg:h-4 shrink-0" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setIsLoginModalOpen(true); setIsMobileMenuOpen(false); }}
                className="px-3 py-1.5 rounded-lg border text-xs font-black transition-all flex items-center justify-start lg:justify-center gap-1.5 cursor-pointer shrink-0 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white border-purple-400/50 shadow-md"
              >
                <UserCircle className="w-3.5 h-3.5 text-purple-200 shrink-0" />
                <span className="text-[11px]">Sign In</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
